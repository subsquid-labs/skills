---
name: migrate-to-portal
description: Migrate an existing Squid SDK indexer (EVM or Solana) off the v2 gateway and onto the Portal data source. Covers the package swap (`@subsquid/evm-processor` → `@subsquid/evm-stream` + `@subsquid/evm-objects` + `@subsquid/batch-processor` for EVM; `@subsquid/solana-stream@^0.x` → `^1.x` for Solana), the API/type shape changes, and field-selection changes. Use when the user mentions migrating, porting, upgrading, or converting a v2 squid to Portal; references `v2.archive.subsquid.io`, `setGateway`, `setDataSource`, `lookupArchive`, or `SolanaRpcClient`; or hits TS errors on `EvmBatchProcessor`, `evmLog`, or `block.header.slot` after a `@subsquid/*` bump.
metadata:
  author: subsquid
  version: "1.0.0"
  category: documentation
---

# Migrate a Squid to Portal

Walks the migration of an existing Squid SDK indexer onto the Portal data source. EVM and Solana have different package sets; the migration shape (data source + types + field selection) is parallel. Upstream docs:

- EVM: <https://docs.sqd.dev/en/sdk/migration/evm-gateway-to-portal>
- Solana: <https://docs.sqd.dev/en/sdk/migration/solana-gateway-to-portal>

## When to use this skill

Activate when the user says any of:

- "migrate my squid to Portal" (EVM or Solana)
- "move off v2 archive / `setGateway` / `setDataSource` / `lookupArchive`"
- "upgrade `@subsquid/evm-processor`" or "`@subsquid/solana-stream` to `1.x`"
- references `https://v2.archive.subsquid.io/...`
- mentions removing `SolanaRpcClient`
- asks about Solana block-height-to-slot conversion
- hits compile errors on `EvmBatchProcessor`, `evmLog`, `block.height`, or `block.header.slot` after a bump

## Pre-flight

1. **Identify the chain.** Grep:
   ```bash
   grep -RE "@subsquid/(evm-processor|solana-stream|archive-registry)" --include="*.ts" --include="*.json" .
   ```
   - `@subsquid/evm-processor` → EVM section below
   - `@subsquid/solana-stream@^0.x` → Solana section below

2. **Verify the Portal dataset slug.** Map the old archive URL `https://v2.archive.subsquid.io/network/<slug>` to the Portal URL:
   ```bash
   curl -sI https://portal.sqd.dev/datasets/<slug>/metadata
   ```
   `200 OK` = exists. `404` = wrong slug — search at <https://portal.sqd.dev/datasets>.

3. **Inventory direct RPC calls in the batch handler.** If the handler uses `new abi.Contract(ctx, header, address)` or `Multicall(...)` for contract reads, the migration needs the optional RPC-client step.

4. **Commit / branch first.** The migration touches imports, types, and the processor entrypoint.

---

## (Optional) Add the v2 gateway API key — EVM or Solana

Skip if going straight to Portal. Read this if the squid is still on the v2 gateway and needs API-key auth (e.g. while staging the Portal migration on a branch).

The `apiKey` field on the gateway settings is supported by:

| Chain | Package | First version with `apiKey` |
|---|---|---|
| EVM | `@subsquid/evm-processor` | `1.30.0` (still v2; `setGateway`-shaped) |
| Solana | `@subsquid/solana-stream` | `0.5.0` (highest 0.x; still `setGateway`-shaped) |

If your squid is on an older release, bump to at least the version above before adding `apiKey`. Older versions reject the field with `TS2353: 'apiKey' does not exist in type 'GatewaySettings'`.

```bash
# EVM
npm i @subsquid/evm-processor@^1.30.0

# Solana
npm i @subsquid/solana-stream@^0.5.0
```

Then convert the call:

```diff
- .setGateway('https://v2.archive.subsquid.io/network/<slug>')
+ .setGateway({
+   url: 'https://v2.archive.subsquid.io/network/<slug>',
+   apiKey: process.env.SQD_API_KEY,
+ })
```

```bash
echo 'SQD_API_KEY=...' >> .env
echo 'SQD_API_KEY=your_api_key_here' >> .env.example
echo '.env' >> .gitignore
```

Both `GatewaySettings.apiKey` definitions document "Defaults to `SQD_API_KEY`" — the field is auto-read from the environment if omitted on the call. Passing it explicitly is clearer.

> Going to `latest` instead skips over the v2-with-`apiKey` configuration: on EVM, `latest` is `@subsquid/evm-stream`/`@subsquid/evm-objects` (Portal stack) where `setGateway` is gone; on Solana, `latest` is `@subsquid/solana-stream@^1.x.x` (Portal-only) where `setGateway` is also gone. Pin the v2 version above only if you need the intermediate v2-with-auth stage.

---

## EVM migration

### Step 1 — Swap packages

```bash
npm uninstall @subsquid/evm-processor @subsquid/archive-registry
npm i @subsquid/evm-stream @subsquid/evm-objects @subsquid/batch-processor @subsquid/logger
```

If the handler makes direct RPC calls (contract state, Multicall):

```bash
npm i @subsquid/rpc-client
```

`@subsquid/util-internal` and `@subsquid/util-internal-hex` get pulled in transitively — no explicit install needed; retarget imports per Step 2.

### Step 2 — Imports

```ts
// before
import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
  BlockData as _BlockData,
  FieldSelection,
  decodeHex,
  assertNotNull,
} from '@subsquid/evm-processor'
import {lookupArchive} from '@subsquid/archive-registry'  // older squids

// after
import * as evmObjects from '@subsquid/evm-objects'
import {DataSourceBuilder, FieldSelection} from '@subsquid/evm-stream'
import type {DataHandlerContext as BaseDataHandlerContext} from '@subsquid/batch-processor'
import type {Logger} from '@subsquid/logger'
import {decodeHex} from '@subsquid/util-internal-hex'   // if used
import {assertNotNull} from '@subsquid/util-internal'   // if used
// `lookupArchive` is gone — use the Portal URL directly.
```

Mapping:

| Old import | New location |
|---|---|
| `EvmBatchProcessor` | gone — replaced by `DataSourceBuilder` from `@subsquid/evm-stream` |
| `EvmBatchProcessorFields<typeof processor>` | gone — derive `Fields` from a literal `fields` object via `typeof fields` |
| `FieldSelection` | `@subsquid/evm-stream` |
| `BlockHeader`, `Log`, `Transaction`, `Trace`, `StateDiff` | `@subsquid/evm-objects` |
| `BlockData` | `@subsquid/evm-objects` — **renamed to `Block`** (see Step 3) |
| `DataHandlerContext` | `@subsquid/batch-processor` (base; augment manually) |
| `decodeHex` | `@subsquid/util-internal-hex` |
| `assertNotNull` | `@subsquid/util-internal` |
| `lookupArchive` | gone — use Portal URL directly |

### Step 3 — Type aliases

**a) Hoist `setFields(...)` into a literal — `EvmBatchProcessorFields<typeof processor>` is gone.**

```ts
export const fields = {
  block: { timestamp: true },
  log: {
    address: true,
    topics: true,
    data: true,
    transactionHash: true,
  },
} satisfies FieldSelection

export const dataSource = new DataSourceBuilder()
  // ...
  .setFields(fields)
  // ...
  .build()

export type Fields = typeof fields
```

The `satisfies FieldSelection` keeps the precise shape of `fields` instead of widening it to `FieldSelection`. Without it, `evmObjects.Log<Fields>` (Step 3c) degrades to "all fields".

**b) `Block` ↔ `BlockData` swap.**

- Old: `Block = BlockHeader<F>` (header only); `BlockData = BlockData<F>` (full payload).
- New: `BlockHeader<F>` = header only; `Block<F>` = full payload. The "Data" suffix is gone.

```ts
// before
export type Block = BlockHeader<Fields>
export type BlockData = _BlockData<Fields>

// after
export type Block = evmObjects.BlockHeader<Fields>     // header only
export type BlockData = evmObjects.Block<Fields>       // full payload
```

Code that expected header-only via `Block` will now type-check against the full payload at compile time and behave differently at runtime. Rename callsites accordingly.

**c) `DataHandlerContext` generic argument order is flipped, and the base no longer carries `log` or `_chain`.**

- Old: `DataHandlerContext<Store, Fields>`. Exposes `log` and `_chain` by default.
- New: `DataHandlerContext<BlockData, Store>` (block payload first, store second). Bare `{store, blocks, isHead}`; you re-attach `log` (Step 5) and `_chain` (Step 6) manually.

```ts
// after, no RPC
export type Context = BaseDataHandlerContext<BlockData, Store> & {
  log: Logger
}

// after, with RPC
import type {RpcClient} from '@subsquid/rpc-client'
export type Context = BaseDataHandlerContext<BlockData, Store> & {
  log: Logger
  _chain: { client: RpcClient }
}
```

### Step 4 — Rewrite the data source

```ts
// before (recent v2 squid)
const processor = new EvmBatchProcessor()
  .setGateway('https://v2.archive.subsquid.io/network/ethereum-mainnet')
  .setRpcEndpoint('https://rpc.example')
  .setFinalityConfirmation(75)
  .addLog({
    address: [CONTRACT],
    topic0: [TOPIC],
    transaction: true,
    range: { from: 6_082_465 },
  })
  .setFields({
    evmLog: { topics: true, data: true },         // legacy key
    transaction: { hash: true },
  })

// before (older v2 squid with lookupArchive)
const processor = new EvmBatchProcessor()
  .setDataSource({
    archive: lookupArchive('eth-mainnet'),
    chain: 'https://rpc.example',
  })
  .setFinalityConfirmation(75)
  // ...

// after (same for both starting shapes)
const dataSource = new DataSourceBuilder()
  .setPortal({
    url: 'https://portal.sqd.dev/datasets/ethereum-mainnet',
    http: { retryAttempts: Infinity },
  })
  .setBlockRange({ from: 6_082_465 })
  .setFields(fields)
  .addLog({
    where: {
      address: [CONTRACT],
      topic0: [TOPIC],
    },
    include: {
      transaction: true,
    },
    range: { from: 6_082_465 },
  })
  .build()
```

Structural changes:

1. **`setRpcEndpoint` / `setFinalityConfirmation` / `setDataSource` are gone.** Portal handles real-time delivery and finality. All three v2 shapes (`setGateway`/`setDataSource`) collapse to a single `.setPortal({...})` call.
2. **`.addLog()` / `.addTransaction()` / `.addTrace()` / `.addStateDiff()` arguments are split into three keys.** Filters under `where`, related items under `include`, block range under `range`. The flat shape (`{ address, topic0, transaction: true, range }`) is rejected by the new type.
3. **`.setFields({ evmLog: ... })` → `.setFields({ log: ... })`.** The selector key for log fields was renamed.
4. **`.build()` must be called** at the end of the chain. Without it, calls like `getBlockStream` are not on the builder type.

Block-selector restriction: `.setFields({ block: { ... } })` only accepts the mutable header fields (`timestamp`, `nonce`, `miner`, `extraData`, etc.). `number`, `hash`, and `parentHash` are always present on the block header — requesting them in the selector is a TS error.

### Step 5 — Wire up `run()` and `augmentBlock`

```ts
import {run} from '@subsquid/batch-processor'
import {augmentBlock} from '@subsquid/evm-objects'
import {createLogger} from '@subsquid/logger'

const logger = createLogger('sqd:processor:mapping')

run(dataSource, db, async (simpleCtx) => {
  const ctx: Context = {
    ...simpleCtx,
    blocks: simpleCtx.blocks.map(augmentBlock),
    log: logger,
    // _chain: { client: rpcClient }  // see Step 6
  }
  // rest of handler unchanged
})
```

The old `processor.run(db, handler)` becomes a free `run(dataSource, db, handler)`. Two things now happen inside the handler that used to be automatic:

1. `augmentBlock()` each block. Raw blocks from the stream are flat objects; `augmentBlock` adds the convenience back-references (`log.transaction`, `log.block`, `block.logs[*].id`, etc.).
2. Attach the logger manually. The new base context doesn't carry `log`.

Block-shortcut renames:

- `block.height` → `block.header.number`
- `block.timestamp` (shortcut) → `block.header.timestamp`
- `log.block.height` → `log.block.number` (after `augmentBlock`)

### Step 6 — (Optional) RPC client for direct chain reads

Skip if the handler doesn't make direct RPC calls (no `new abi.Contract(ctx, header, address)`, no `ctx._chain.client.call(...)`).

```ts
import {RpcClient} from '@subsquid/rpc-client'

const rpcClient = new RpcClient({
  url: process.env.RPC_URL!,
  rateLimit: 100,
})

run(dataSource, db, async (simpleCtx) => {
  const ctx: Context = {
    ...simpleCtx,
    blocks: simpleCtx.blocks.map(augmentBlock),
    log: logger,
    _chain: { client: rpcClient },
  }
  // Contract reads via new abi.Contract(ctx, header, address) work unchanged.
})
```

### Step 7 — Hot blocks on the store

```ts
const db = new TypeormDatabase({ supportHotBlocks: true })
```

Required for the store to apply forked-block rollbacks once the indexer reaches the chain head. Without it, writes are rejected when Portal starts delivering unfinalized blocks. Other store backends accept the same option.

### Step 8 — Field selection

The new stream fetches **only** the fields listed in `.setFields()`. The v2 processor merged a default set (`log.address`, `log.topics`, `log.data`, `block.timestamp`, `transaction.from/to/hash`) into the user's selection — the new stream does not, and TypeScript enforces it.

Typical minimum for a log-indexing squid:

```ts
const fields = {
  block: { timestamp: true },
  log: {
    address: true,
    topics: true,
    data: true,
    transactionHash: true,
  },
  transaction: {       // only if include: { transaction: true }
    from: true,
    to: true,
    hash: true,
    value: true,
  },
} satisfies FieldSelection
```

If the handler reaches into a field not listed, TS rejects the access.

---

## Solana migration

> For v2-with-`apiKey` (staging on a branch before the Portal migration), see "(Optional) Add the v2 gateway API key" near the top of this skill — same instructions for both chains, with the Solana version cut-off being `@subsquid/solana-stream@^0.5.0`.

### Step 1 — Code cleanup, then upgrade packages

Before bumping, remove `SolanaRpcClient` references from the source — they will not compile after the bump:

```diff
-import {DataSourceBuilder, SolanaRpcClient} from '@subsquid/solana-stream'
+import {DataSourceBuilder} from '@subsquid/solana-stream'

 const dataSource = new DataSourceBuilder()
   .setGateway('https://v2.archive.subsquid.io/network/solana-mainnet')
-  .setRpc(process.env.SOLANA_NODE == null ? undefined : {
-    client: new SolanaRpcClient({ url: process.env.SOLANA_NODE }),
-    strideConcurrency: 10,
-  })
   // ...
```

Then upgrade:

```bash
npx --yes npm-check-updates --filter "@subsquid/*" --target "@latest" --upgrade
npm install   # or pnpm install / yarn install
```

This bumps `@subsquid/solana-stream` to `^1.x.x` (currently `1.1.1`), `@subsquid/solana-objects` to `^1.x.x`, `@subsquid/batch-processor` to `^1.x.x`, and `@subsquid/typeorm-store` to `^1.x.x`.

If install fails with `ETARGET No matching version found for @subsquid/solana-rpc@^1.0.0`, your `solana-stream` resolved to `1.1.0` (which declared a stale runtime dep on `solana-rpc`). Fixed in `1.1.1`; force it:

```bash
npm install @subsquid/solana-stream@^1.1.1
```

### Step 2 — Rewrite the data source

```ts
// before
const dataSource = new DataSourceBuilder()
  .setGateway('https://v2.archive.subsquid.io/network/solana-mainnet')
  .setBlockRange({ from: 289_819_150 })   // BLOCK HEIGHT
  // ... .setFields(...), .addInstruction(...)
  .build()

// after
const dataSource = new DataSourceBuilder()
  .setPortal({
    url: 'https://portal.sqd.dev/datasets/solana-mainnet',
    http: { retryAttempts: Infinity },
  })
  .setBlockRange({ from: 317_617_480 })   // SLOT NUMBER
  // ... .setFields(...), .addInstruction(...)
  .build()
```

Structural changes:

1. Replace `.setGateway(...)` (and `.setRpc({...})` if present) with `.setPortal({ url, http })`. `http: { retryAttempts: Infinity }` is recommended for production — without it the indexer exits on transient non-2xx Portal responses.
2. Convert the block-range `from` from a block height to a slot number. Solana exposes both; the v2 archive used heights, Portal uses slots. Use the interactive bisection converter embedded at <https://docs.sqd.dev/en/sdk/migration/solana-gateway-to-portal> (binary-searches the public Portal).

Selectors inside `.addInstruction({ where, include })` and field selection in `.setFields({...})` keep the same shape.

### Step 3 — Block-header rename in the handler

`block.header.slot` → `block.header.number`. The Portal `BlockHeader` only exposes `.number`, which on Solana represents the slot.

```diff
 let exchange = new Exchange({
   id: ins.id,
-  slot: block.header.slot,
+  slot: block.header.number,
   // ...
 })
```

Same for `transaction.block.slot` / `instruction.block.slot` if those were traversed.

### Step 4 — Hot blocks on the store

```ts
// before
const database = new TypeormDatabase()

// after
const database = new TypeormDatabase({ supportHotBlocks: true })
```

Required for the store to apply Portal's hot-block updates once the indexer reaches the chain head.

### Step 5 — Field selection

The Portal `solana-stream` fetches only the fields listed in `.setFields()`. The v2 default set is:

```
block:        { slot, parentSlot, timestamp }
transaction:  { signatures, err }
instruction:  { programId, accounts, data, isCommitted }
log:          { programId, kind, message }
balance:      { pre, post }
tokenBalance: { preMint, preDecimals, preOwner, preAmount,
                postMint, postDecimals, postOwner, postAmount }
reward:       { lamports, rewardType }
```

The Portal default set is narrower — most notably `tokenBalance` now defaults to `{ preAmount, postAmount, preOwner, postOwner }` only. Fields used in the handler that are not in the Portal defaults must be requested explicitly.

Typical minimum for a swap-style instruction handler:

```ts
.setFields({
  block: { timestamp: true },
  transaction: {
    signatures: true,
    accountKeys: true,   // not in defaults; needed if you read tx.accountKeys
  },
  instruction: {
    programId: true,
    accounts: true,
    data: true,
  },
  tokenBalance: {
    preAmount: true,
    postAmount: true,
    preOwner: true,
    postOwner: true,
    preMint: true,       // v2 default, NOT in Portal default
    postMint: true,      // v2 default, NOT in Portal default
  },
})
```

`block.header.number` (the slot) is always available without being requested. Block **height** is not — request via `block: { height: true }` only if your handler reads it.

---

## Common errors (quick index)

Full table with fixes in `references/common-errors.md`.

**Either chain (v2-with-apiKey staging)** — `TS2353: 'apiKey' does not exist in type 'GatewaySettings'` (need `@subsquid/evm-processor@^1.30.0` on EVM or `@subsquid/solana-stream@^0.5.0` on Solana).

**EVM** — `TS2353 ... 'address' does not exist` on `.addLog` (filters → `where:`, related-items → `include:`) · `'evmLog' does not exist in type 'FieldSelection'` (rename to `log:`) · `'getBlockStream' does not exist on type 'DataSourceBuilder'` (missing `.build()`) · `Property 'address'/'topics'/'data'/'timestamp'/'from' does not exist on type 'Log'` (field not in `.setFields()`) · `Property 'height' does not exist on type 'BlockHeader'` (use `block.header.number`) · `Module '@subsquid/evm-processor' has no exported member 'decodeHex'`/`'assertNotNull'` (retarget to `@subsquid/util-internal-hex` / `@subsquid/util-internal`).

**Solana** — `Module '"@subsquid/solana-stream"' has no exported member 'SolanaRpcClient'` (drop import + `.setRpc`) · `ETARGET No matching version found for @subsquid/solana-rpc@^1.0.0` (fixed in `solana-stream@^1.1.1`) · `HttpError: Got 404 ... solana-mainnet dataset starts from <height> block` (bump `from:` above the value in the 404 body, or finish the Portal migration) · `Property 'slot' does not exist on type 'BlockHeader'` (use `block.header.number`) · `Property 'preMint'/'postMint' does not exist on type 'TokenBalance<F>'` (add to `.setFields({ tokenBalance: {...} })`) · `Property 'signatures'/'accountKeys' does not exist on type 'Transaction'` (field not in `.setFields()`) · indexer exits on transient HTTP errors (`http: { retryAttempts: Infinity }`).

## References

- `references/evm-example-diff.md` — canonical USDC-transfers diff
- `references/solana-example-diff.md` — canonical Whirlpool-swap diff
- `references/common-errors.md` — extended errors with full fixes

## Related skills

- **portal** — query the same Portal datasets directly once migrated.
- **squid-perf** — compare sync time between v2 and Portal deployments.
