# Decoder Layouts

Each section is one way to tell an EVM pipe which logs to decode, with code that runs on `@subsquid/pipes` `1.0.0-beta.11`. SKILL.md step 1 picks the layout. Two rules hold for all of them:

- `evmEventDecoder` requires `range`. Without it the pipe stops with `Cannot read properties of undefined (reading 'from')`.
- The decoder's output is an object of arrays named after the keys of `events` (`data.swaps`, `data.transfers`). Map each array; `data` itself is not iterable.

Errors, cursor resets and sync speed live in [TROUBLESHOOTING.md](TROUBLESHOOTING.md) and [PERFORMANCE.md](PERFORMANCE.md).

## Fixed contracts

One address, or a list of addresses that share an ABI. Each decoded row carries its emitter in `d.contract`.

```typescript
evmEventDecoder({
  range: { from: 6082465 },
  contracts: ['0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'],
  events: {
    transfers: commonAbis.erc20.events.Transfer,
    approvals: commonAbis.erc20.events.Approval,
  },
}).pipe(({ transfers, approvals }) => ({
  transfers: transfers.map((d) => ({
    blockNumber: d.block.number,
    txHash: d.rawEvent.transactionHash,
    logIndex: d.rawEvent.logIndex,
    contract: d.contract,
    from: d.event.from,
    to: d.event.to,
    value: d.event.value.toString(),
  })),
  approvals: approvals.map((d) => ({ /* same shape */ })),
}))
```

## Contracts created by a factory

`contractFactory` reads the factory's creation event, stores each child address in SQLite, and decodes the `events` of the children it knows. The `uniswapV3Swaps` CLI template generates this layout.

```typescript
import { contractFactory, contractFactorySqliteStore, evmEventDecoder } from '@subsquid/pipes/evm'

evmEventDecoder({
  range: { from: 12369621 },   // the factory's deployment block
  contracts: contractFactory({
    address: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
    event: factoryEvents.PoolCreated,
    childAddressField: 'pool',
    database: contractFactorySqliteStore({ path: './uniswap3-eth-pools.sqlite' }),
  }),
  events: { swaps: poolEvents.Swap },
})
```

Each row carries the creation event in `d.factory.event` (for Uniswap V3: `token0`, `token1`, `fee`).

**The decoder knows only children created at or after `range.from`.** Events from older children are dropped with no error and no log line, so a recent window returns a plausible but partial table. Measured on Uniswap V3 over Ethereum blocks 12,376,000 to 12,377,000: the scaffold alone stored 677 swaps from 89 pools, and 1,600 swaps from 123 pools once the 52 older pools were loaded first.

| The requested window | Do |
|---|---|
| Starts at the factory's deployment block | Use the decoder as above |
| Starts later ("the last 48 hours") | Run the [history pass](#history-pass-for-a-window-that-starts-later) before the main pipe |
| Starts later, and the history pass's ETA is longer than the task allows | [Index by topic0 and confirm each emitter](#when-the-history-pass-is-too-slow) |

### History pass for a window that starts later

Read the creation events from the factory's deployment block up to the block before the window, save them into the same store, then start the main pipe with that store. Put this ahead of the scaffold's `evmPortalStream` call in `src/index.ts`:

```typescript
const store = await contractFactorySqliteStore({ path: './uniswap3-eth-pools.sqlite' })
await store.migrate()

const history = evmPortalStream({
  id: 'univ3-factory-history',
  portal: 'https://portal.sqd.dev/datasets/ethereum-mainnet',
  outputs: evmEventDecoder({
    range: { from: 12369621, to: WINDOW_FROM_BLOCK - 1 },
    contracts: ['0x1f98431c8ad98523631ae4a59f267346ea31f984'],
    events: { created: factoryEvents.PoolCreated },
  }),
})

for await (const { data } of history) {
  await store.save(
    data.created.map((c) => ({
      childAddress: c.event.pool,
      factoryAddress: c.contract,
      blockNumber: c.block.number,
      transactionIndex: c.rawEvent.transactionIndex,
      logIndex: c.rawEvent.logIndex,
      event: c.event,
    })),
  )
}
```

Then pass `database: store` to `contractFactory` in the main decoder. The history range takes block numbers, so resolve the window's first block first (the **portal** skill, step 3).

The pass has no cursor: it reruns from the deployment block on every start, and `save` skips addresses it already holds. For an indexer that restarts often, skip the pass when `(await store.all()).length > 0`.

Done when `sqlite3 <file>.sqlite "SELECT count(*) FROM factory"` is above zero before the main pipe logs its first block, and a child you know predates the window appears in the target table.

### When the history pass is too slow

The history pass reads every block since the factory was deployed, one Portal data chunk per request. Its first progress line prints an ETA. On the shared public Portal that ETA was hours for Uniswap V3 on Ethereum (14 million blocks) on 2026-11-12. When the task cannot spend it:

1. Index the window with [topic0 only](#any-contract-that-emits-the-event-topic0-only) and store the emitter in a `pool` column.
2. Confirm each distinct emitter against the factory over RPC, batched through Multicall3 (code below). Write the confirmed addresses to their own table.
3. Answer from the join: `WHERE pool IN (SELECT address FROM confirmed_pools)`.

Step 2 is required because forks reuse event signatures. In one 48-hour Ethereum window, 325 of the 3,475 contracts that emitted the Uniswap V3 `Swap` signature were not pools of the official factory.

For Uniswap V3 the check reads the emitter's `token0()`, `token1()` and `fee()`, then asks the factory whether `getPool(token0, token1, fee)` is the emitter. With `viem` (`npm install viem`) and any public RPC for the chain:

```typescript
import { createPublicClient, http, parseAbi } from 'viem'
import { mainnet } from 'viem/chains'

const client = createPublicClient({ chain: mainnet, transport: http(RPC_URL) })
const poolAbi = parseAbi([
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function fee() view returns (uint24)',
])
const factoryAbi = parseAbi(['function getPool(address, address, uint24) view returns (address)'])

// A call that reverted is an answer. Any other failure is a lost request: stop and rerun.
const NOT_A_CHILD = ['ContractFunctionRevertedError', 'ContractFunctionZeroDataError']
function answered<T extends { status: string; error?: Error }>(results: T[]): T[] {
  for (const r of results) {
    if (r.status === 'failure' && !NOT_A_CHILD.includes((r.error?.cause as Error)?.name)) throw r.error
  }
  return results
}

const meta = answered(
  await client.multicall({
    batchSize: 2048,
    contracts: emitters.flatMap((address) =>
      (['token0', 'token1', 'fee'] as const).map((functionName) => ({ address, abi: poolAbi, functionName })),
    ),
  }),
)
const candidates = emitters.flatMap((address, i) => {
  const [token0, token1, fee] = meta.slice(i * 3, i * 3 + 3)
  if (token0.status !== 'success' || token1.status !== 'success' || fee.status !== 'success') return []
  return [{ address, token0: token0.result as `0x${string}`, token1: token1.result as `0x${string}`, fee: fee.result as number }]
})
const pools = answered(
  await client.multicall({
    batchSize: 2048,
    contracts: candidates.map((c) => ({
      address: FACTORY, abi: factoryAbi, functionName: 'getPool', args: [c.token0, c.token1, c.fee],
    } as const)),
  }),
)
const confirmed = candidates.filter((c, i) => (pools[i].result as string | undefined)?.toLowerCase() === c.address.toLowerCase())
```

`emitters` is the list from `SELECT DISTINCT pool`, typed `` `0x${string}`[] ``. This confirmed 3,150 of 3,475 emitters in under one second on each of `eth.drpc.org`, `rpc.mevblocker.io` and `ethereum-rpc.publicnode.com`. Plain JSON-RPC batches of the same calls took nine minutes against those providers' rate limits.

Keep `batchSize` at 2048 and keep `answered`. `multicall` reports a failed HTTP request as a `failure` on every call in that batch, the same status as a revert, so without the check a lost batch reads as hundreds of contracts that are not pools. A 16 KB batch failed that way on two of the three providers.

## Any contract that emits the event (topic0 only)

Omit `contracts`. Portal filters by the event's topic0 alone, and `d.contract` names the emitter.

```typescript
evmEventDecoder({
  range: { from: '2026-11-09T23:14:47Z', to: '2026-11-11T23:14:47Z' },
  events: { swaps: poolEvents.Swap },
}).pipe(({ swaps }) => swaps.map((s) => ({ pool: s.contract, ...s.event })))
```

Use it when the signature belongs to one protocol (`ReallocateSupply`, `StrategyReported`), or with the emitter check above. A generic signature such as `Transfer` matches every token on the chain.

## Several decoders in one pipe

Different ABIs on different contracts each get a decoder under a named key of `outputs`. The batch then has one entry per key.

```typescript
evmPortalStream({
  id: 'transfers-and-swaps',
  portal: 'https://portal.sqd.dev/datasets/base-mainnet',
  outputs: {
    transfers: evmEventDecoder({ range, contracts: [USDC], events: { transfer: commonAbis.erc20.events.Transfer } }),
    pool: evmEventDecoder({ range, contracts: [POOL], events: { swap: poolEvents.Swap, mint: poolEvents.Mint } }),
  },
})
// data.transfers.transfer, data.pool.swap, data.pool.mint
```

## Filter on indexed parameters

An entry of `events` can be `{ event, params }`. Portal applies the filter, so unmatched logs never leave the server. Only indexed parameters can be filtered, and each takes one value or a list.

```typescript
evmEventDecoder({
  range: { from: 24171448, to: 24171449 },
  events: {
    approvals: commonAbis.erc20.events.Approval,
    transfers: {
      event: commonAbis.erc20.events.Transfer,
      params: { from: ['0x87482e84503639466fad82d1dce97f800a410945'], to: '0x10b32a54eeb05d2c9cd1423b4ad90c3671a2ed5f' },
    },
  },
})
```

Two entries for the same event in one decoder must filter an indexed parameter on value lists that share no value. Otherwise the decoder refuses to start with [E0004](TROUBLESHOOTING.md#e0004-two-evm-decoder-entries-match-the-same-log); put overlapping filters in separate decoders under `outputs`.

### Filter a factory's children

The same `{ event, params }` form on the factory's creation event limits which children are tracked. This decodes swaps only from pools whose `token0` is WETH:

```typescript
contractFactory({
  address: '0x1f98431c8ad98523631ae4a59f267346ea31f984',
  event: { event: factoryEvents.PoolCreated, params: { token0: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' } },
  childAddressField: 'pool',
  database: contractFactorySqliteStore({ path: './uniswap3-eth-pools.sqlite' }),
})
```

## Custom target

For a destination no built-in target covers, `createTarget` from `@subsquid/pipes` takes a `write` function that reads batches:

```typescript
import { createTarget } from '@subsquid/pipes'

await stream.pipeTo(
  createTarget({
    write: async ({ read, id }) => {
      for await (const { data, ctx } of read(/* { latest, finalized } loaded from your store */)) {
        // write data, then save ctx.stream.state.current under the pipe id
      }
    },
  }),
)
```

A custom target owns its cursor: pass the saved state to `read()` to resume, and save the batch's cursor in the same transaction as its rows. For a stream that includes unfinalized blocks, also implement `resolveFork`. The built-in targets do all of this, so reach for a custom one only when none of them fits ([SDK_FEATURES.md](SDK_FEATURES.md#target-configuration)).

## RPC latency watcher

`evmRpcLatencyWatcher({ rpcUrl: string[] })` from `@subsquid/pipes/evm` measures how far Portal's head trails your RPC providers. `bitcoinRpcLatencyWatcher({ rpcUrl, intervalMs? })` from `@subsquid/pipes/bitcoin` does the same by polling Bitcoin Core.

```typescript
const stream = evmPortalStream({
  id: 'indexing-latency',
  portal: 'https://portal.sqd.dev/datasets/base-mainnet',
  outputs: evmRpcLatencyWatcher({ rpcUrl: ['https://base.drpc.org', 'https://base-rpc.publicnode.com'] }),
})

for await (const { data } of stream) {
  if (data) console.table(data.rpc) // [{ url, receivedAt, portalDelayMs }]
}
```
