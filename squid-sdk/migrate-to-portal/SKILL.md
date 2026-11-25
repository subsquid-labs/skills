---
name: migrate-to-portal
description: Migrate a Squid SDK indexer (EVM or Solana) from the v2 gateway to the Portal data source. Use when a squid still calls setGateway, setDataSource, lookupArchive or v2.archive.subsquid.io, when a self-hosted squid gets 401 from the v2 gateway, or when TypeScript breaks on EvmBatchProcessor, evmLog, SolanaRpcClient, block.height or block.header.slot after a @subsquid/* upgrade.
license: Apache-2.0
metadata:
  author: subsquid
  version: "1.2.4"
  category: documentation
---

# Migrate a Squid to Portal

Moves an existing Squid SDK indexer from the v2 gateway onto Portal. Both chains change the same three things (the data source, the types, and an explicit field selection) with different packages, so each chain's steps live in their own reference. Upstream guide: <https://docs.sqd.dev/en/sdk/squid-sdk/evm/guides/migration/gateway-to-portal>.

The v2 gateways are being shut down dataset by dataset, and self-hosted v2 calls have needed an API key since 2026-05-19. A squid on a dataset that is already Portal-only stays broken until it migrates.

## 1. Pre-flight

1. **Identify the chain.**
   ```bash
   grep -RE "@subsquid/(evm-processor|solana-stream|archive-registry)" --include="*.ts" --include="*.json" .
   ```
   `@subsquid/evm-processor` is the EVM branch; `@subsquid/solana-stream@^0.x` is the Solana branch.

2. **Confirm the dataset is served and staying.** First look the chain up in the retirement notices at <https://docs.sqd.dev/announcements> and <https://docs.sqd.dev/changelog>; a dataset can answer `200` today with an end date already announced. Then map the old `https://v2.archive.subsquid.io/network/<slug>` to Portal:
   ```bash
   curl -s https://portal.sqd.dev/datasets/<slug>/metadata
   # {"dataset":"ethereum-mainnet","aliases":[],"real_time":true,"start_block":0}
   ```
   A JSON answer means Portal serves it. `404` means the slug was renamed or retired: search <https://portal.sqd.dev/datasets>. Retired so far: 67 low-usage datasets (2026-08-20), Moonbeam, Moonriver, Polygon zkEVM and Taiko (2026-09-22), Blast and Abstract (2026-10-20), Gravity Alpha and Enjin (2026-11-04). A retired dataset has no Portal target, so the squid moves to the EVM RPC source or a private Portal instead; tell the user before changing code, and tell them the end date of a dataset that has one. Note `real_time` too: a `false` dataset does not follow the chain head (on 2026-11-25, 72 of the 106 public datasets, some days behind), which decides the EVM data source in `references/evm-migration.md` Step 4.

3. **Inventory direct RPC calls in the batch handler.** `new abi.Contract(ctx, header, address)` or `Multicall(...)` means the migration includes the RPC-client step.

4. **Decide real-time or finalized-only.** A v2 source with `.setRpcEndpoint()` (EVM) or `.setRpc()` (Solana) next to `.setGateway()` was real-time. A gateway-only source processed finalized data only. Step 3 preserves whichever it was.

5. **Check for Portal-beta code.** A squid that already calls `.setPortal(...)` next to `.setRpcEndpoint()` migrates the same way: that `.setPortal` call is removed with the rest of the old processor setup.

6. **Work on a branch,** with Node.js 22 or later. The migration rewrites imports, types and the processor entry point.

Done when you can state the chain, the Portal slug that answered and has no announced retirement (or the end date the user accepted) with its `real_time` value, real-time or finalized-only, and whether the handler reads from RPC.

## 2. Run the chain's steps

| Chain | Steps | Worked diff |
|---|---|---|
| EVM | `references/evm-migration.md` | `references/evm-example-diff.md` |
| Solana | `references/solana-migration.md` | `references/solana-example-diff.md` |

Staying on v2 is a separate path, for an EVM squid whose user explicitly wants to remain on a v2 gateway that still serves its dataset: `references/v2-auth.md` adds the gateway API key and ends there, at a squid that reads the gateway without a `401`; steps 3 to 5 belong to a migration. A Solana squid migrates to Portal: its v2 gateway has kept only the last 30 days of data since 2026-06-01 and is scheduled for removal.

Done when every step in the chain's reference is applied to the project.

## 3. Set hot-block support on the store

| The v2 source was | Store | Portal endpoint the data source reads |
|---|---|---|
| Real-time (gateway plus RPC) | `new TypeormDatabase()`; `supportHotBlocks: true` is the default | `/stream` |
| Finalized-only (gateway alone) | `new TypeormDatabase({ supportHotBlocks: false })` | `/finalized-stream` |

Hot-block support lets the store roll back forked blocks once the indexer reaches the chain head. Finalized-only suits append-only destinations. Other store backends take the same option.

## 4. Verify

1. No v2 code is left: this prints no line of code (a comment that mentions an old name is fine).
   ```bash
   grep -RnE "v2\.archive\.subsquid\.io|setGateway|setRpcEndpoint|setFinalityConfirmation|lookupArchive|SolanaRpcClient|@subsquid/(evm-processor|archive-registry)" src package.json
   ```
2. `npx tsc --noEmit` exits `0`. Look each remaining error up by its message in `references/common-errors.md`.
3. A local run processes blocks: build and start the squid the way the project does (commonly `npm run build`, `npx squid-typeorm-migration apply`, `node --require=dotenv/config lib/main.js`), and watch the processor log progress past the configured start block while rows land in the store. A real-time squid keeps running after it reaches the head.

Done when all three hold.

## 5. Deploy on the existing database

An EVM squid keeps its database and continues from the last block it processed; a re-sync is optional. `EvmBatchProcessor` and `run()` from `@subsquid/batch-processor` share the store's state tables (`squid_processor.status`, `squid_processor.hot_block`) and identify a block by number and hash, and `@subsquid/evm-objects` produces the same entity IDs (`log.id`, `transaction.id`, ...) as `evm-processor`, so new rows line up with old ones. On start the processor logs `last processed block was N`, resumes at `N + 1`, and Portal checks the stored hash of `N`; orphaned hot blocks are rolled back like any fork.

Continuing requires:
- the same database, the same `stateSchema`, and the same `supportHotBlocks` value as before;
- `@subsquid/batch-processor` newer than 1.1.0 when the store keeps hot blocks (1.1.0 and earlier can exit with `Unable to process fork` when the old processor's last hot blocks were orphaned);
- no schema or handler change that would need a re-sync on its own.
- awareness of two pre-existing traps the switch can expose: a squid synced with `evm-processor` below 1.9.0 stores entity IDs as `<height>-<index>-<hash>` (new rows get `<height>-<hash>-<index>`, so code that rebuilds an old entity's ID misses it), and Portal batches are far larger than RPC ones, so a handler that registers factory children only after its batch loop drops their same-batch events. Read the handler for both before deploying.

Deploy accordingly:
- On [SQD Cloud](https://docs.sqd.dev/en/cloud/overview), [re-deploy](https://docs.sqd.dev/en/cloud/reference/cli/deploy) into the same slot without `--hard-reset`. A self-hosted squid restarts on the new code against the same database.
- Done when the processor log shows `last processed block was N` followed by progress past `N`, with no gap in the squid's rows around `N`.
- To validate the whole history through the new data path anyway, re-sync in a new Cloud slot and move the production tag when it catches up ([zero-downtime updates](https://docs.sqd.dev/en/cloud/resources/slots-and-tags#zero-downtime-updates)).
- A Solana database that stored block heights in its status row needs the [re-sync workaround](https://docs.sqd.dev/en/sdk/squid-sdk/solana/guides/migration/solana-resync-workaround) before it continues on slots.

## After the migration

- **Dedicated Portal with an API key.** Migrate to the public Portal first, then switch `.setPortal()` to `{ url, http: { headers: { 'x-api-key': key } } }` with the URL and key read from the environment. `http` replaces the HTTP client settings as a whole, so keep `retryAttempts` beside `headers`. Guides: [EVM](https://docs.sqd.dev/en/sdk/squid-sdk/evm/guides/migration/portal-api-key), [Solana](https://docs.sqd.dev/en/sdk/squid-sdk/solana/guides/migration/portal-api-key).
- **Portal with RPC failover.** The `@subsquid/squid-sdk` umbrella package builds a data source from an ordered list of Portal and RPC sources and fails over when the active one errors or hangs: [fallback reference](https://docs.sqd.dev/en/sdk/squid-sdk/evm/reference/evm-fallback).
- **portal** skill: query the same datasets directly. **squid-perf** skill: compare sync time between the v2 and Portal deployments.
