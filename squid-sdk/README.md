# Squid SDK Agent Skills

Skills for AI coding agents working with the [Squid SDK](https://docs.sqd.dev) - a production-grade blockchain indexing framework.

## Installation

```bash
npx skills add subsquid-labs/skills/squid-sdk/migrate-to-portal
npx skills add subsquid-labs/skills/squid-sdk/squid-perf
```

To install every SQD skill, including these two nested ones, use `npx skills add subsquid-labs/skills --all --full-depth` (see the [root README](../README.md#installation)).

## Skills

### migrate-to-portal

Migrates an existing Squid SDK indexer, EVM or Solana, off the v2 gateway and onto the Portal data source. Mirrors the official guide ([Migrate a squid to Portal](https://docs.sqd.dev/en/sdk/squid-sdk/evm/guides/migration/gateway-to-portal)) and fills in gaps the docs miss:

- EVM squids that must stay on a v2 gateway for now: the `setGateway({ url, apiKey })` step with `@subsquid/evm-processor@^1.30.0`, which reads `SQD_API_KEY` from the environment. API keys are mandatory for self-hosted gateway calls since **2026-05-19 12:00 UTC**, per [the announcement](https://docs.sqd.dev/announcements/gateway-api-keys); get one at <https://portal.sqd.dev/app>. Solana squids migrate to Portal directly.
- EVM: the `evmLog` → `log` field-selection rename; `decodeHex` and `assertNotNull` import moves to `@subsquid/util-internal-hex` / `@subsquid/util-internal`; removal of `@subsquid/archive-registry` for older `lookupArchive` squids; unwinding the `EvmBatchProcessorFields<typeof processor>` typegen pattern; the `Block` ↔ `BlockData` swap; the flipped `DataHandlerContext` generic order; `block.height` → `block.header.number`.
- Solana: ordering `SolanaRpcClient` removal *before* the package bump; block-height → slot conversion; `block.header.slot` → `block.header.number`; `supportHotBlocks: true`; Portal `solana-stream@^1.x.x` no longer ships a default field set, so every field your handler reads must be in `.setFields()` (notably `tokenBalance.preMint` / `postMint`, `transaction.signatures`, `block.header.timestamp`).

**Install just this skill:**
```bash
npx skills add subsquid-labs/skills/squid-sdk/migrate-to-portal
```

[**See skill details →**](./migrate-to-portal/SKILL.md)

### squid-perf

Compare sync-time performance across one or more Squid SDK deployments. Fetches logs via the `sqd` CLI, parses per-service progress, and generates a self-contained HTML report plus a Markdown summary with wall-clock / active-time / downtime breakdowns at percentage-based block breakpoints. Also supports single-indexer mode (metrics only, no comparison).

**Invoke:** `/squid-perf`

**What it reports:**
- **Wall-clock elapsed** (headline), **active processing time** (excludes gaps > 120s), and **downtime** (wall − active) at 10 evenly-spaced breakpoints across each service's sync range.
- Tier 1 metrics from `sqd:processor` / `sqd:batch-processor` progress lines (current block, target, rate, items/sec, ETA).
- Tier 2 signals: `sqd:multicall` latency, restart detection, ERROR/WARN lines.
- Tier 3: auto-discovered logger namespaces rendered as count/mean/median/p95 tables.
- Per-service comparison tables for services present in every deployment; "solo metrics" section (with warning) for services present in only some.

**Install just this skill:**
```bash
npx skills add subsquid-labs/skills/squid-sdk/squid-perf
```

[**See skill details →**](./squid-perf/SKILL.md)

## Resources

- **Squid SDK Documentation**: [docs.sqd.dev](https://docs.sqd.dev)
- **SQD**: [sqd.dev](https://sqd.dev)

## License

[Apache-2.0](../LICENSE), matching the rest of this repository.
