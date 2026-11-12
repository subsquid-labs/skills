# Changelog

What changed in each release of the SQD agent skills, newest first. Entries
describe what changed for you as a user of the skills; the full commit-level
detail lives in the auto-generated section of each
[GitHub release](https://github.com/subsquid-labs/skills/releases).

## Unreleased

These changes come from eleven end-to-end test runs on 2026-11-11 and 12, in
which agents built real indexers and ran real Portal queries from the skills
and the results were checked against RPC nodes and exchange APIs. Three of
the runs repeated earlier scenarios against the fixed skills.

### Improved

- `pipes-sdk` has a working recipe for factory contracts in a recent window. A
  factory indexer only learns the contracts created after its start block, so
  a "last 48 hours of Uniswap V3 swaps" indexer silently missed every older
  pool (58% of swaps in our test). The skill now loads older contracts first.
  When that pass is too slow, it indexes by event signature and confirms each
  contract against the factory with a batched RPC check, which took under a
  second for 3,475 contracts.
- `pipes-sdk` validation is five checks that each caught a wrong result behind
  a clean exit: time bounds, row identity, formats, a bounded Portal
  comparison, and one source outside Portal. It works for Solana and
  Hyperliquid as well as EVM, and reminds you to divide by the token's real
  decimals.
- `pipes-sdk` patterns reference is now runnable code for each decoder layout.
  Unverified benchmarks, a non-existent `wildcardContracts` option and advice
  that contradicted the main skill are gone.
- `portal` shows how to get the traces of one transaction from its hash, and
  how to join Bitcoin outputs to their transaction IDs.
- `migrate-to-portal` records a type-check baseline before changing anything,
  converts a Solana block height to a slot with a script an agent can run, and
  checks stored rows against an RPC before calling the migration done.

### Fixed

- `pipes-sdk`: on ClickHouse 26.8 or later, a freshly generated indexer stored
  every timestamp as `9999-12-31` and still exited cleanly. The skill now
  checks the server version and adds the one client setting that fixes it.
- `pipes-sdk`: the fix for the CLI's incompatible contract types sits in the
  build steps with both commands, and the Solana template's stale row helper
  is listed next to it. A type check is now part of the build steps.
- `pipes-sdk`: the schema guide told agents to store wide integers as
  strings while the CLI generates `UInt256` and `Int256` columns. The guide
  now matches the generated tables.
- `pipes-sdk` and `portal`: Hyperliquid fills have no liquidation flag, and
  the dataset produces about 14 blocks a second, not one. Both skills said
  otherwise or said nothing.
- `portal` and `pipes-sdk`: the time-to-block endpoint mixes seconds and
  milliseconds on Hyperliquid fills, Tron and Substrate datasets, and answers
  one fixed slot for Solana times older than about a month. The skills now
  use it only on EVM and Bitcoin datasets and for recent Solana times, and
  `portal` ships `scripts/block-at.sh` for the rest, which finds the block
  from header timestamps in 4 to 8 requests.
- `portal`: the Solana volume estimate counted blocks instead of instructions.
- `migrate-to-portal`: the Solana example kept `timestamp * 1000` after the
  upgrade, which stores dates tens of thousands of years ahead, because the
  new package already delivers milliseconds. The steps also cover ABI modules
  that stop compiling against the current `@subsquid/evm-abi`.

## November 11, 2026 — v1.1.0

### New

- `pipes-sdk` now covers BigQuery as a first-class sink: the GCP prerequisites,
  the partitioning and clustering choices that are locked in the moment a table
  is created, how forks and crashes are repaired, the target's error codes, and
  how to query the resulting tables without running up a bill.

### Improved

- `portal` handles setup requests such as the Portal app's "Onboard your agent"
  prompt: it adds the Portal MCP server for Claude Code, Codex, Cursor and VS Code,
  stores a Portal API key outside version control, sends it as
  `Authorization: Bearer` (or `x-api-key`), checks it with a one-block stream
  request, and explains each `403` code. `pipes-sdk` shows how to pass the key
  to the Portal client.
- `portal` now routes Tron questions to the `portal_tron_query_logs` and
  `portal_tron_query_transactions` MCP tools and EVM internal-call questions to
  `portal_evm_query_traces`, and points at the server's `sqd://investigations`
  workflow guide.
- `portal` checks an MCP result before stating a fact from it: whether every
  matching row is present, how current the indexed data is, and whether more
  pages remain. An answer built on a partial result says so.
- `pipes-sdk` connection examples use injected credentials or protected client files,
  and diagnostics keep secret values out of terminal output.
- `pipes-sdk` and `portal` validate fetched data before using it in tool requests;
  custom ABI generation uses reviewed local JSON inputs.
- Every skill declares its Apache-2.0 license in its frontmatter, so a skill
  installed on its own carries its license terms.
- `migrate-to-portal` and `squid-perf` describe their triggers more precisely,
  and `migrate-to-portal` links to the current documentation URLs instead of
  redirecting ones.
- `pipes-sdk` settles the database environment before scaffolding and never
  starts a Docker container without explicit confirmation, and a new pattern
  table routes an indexer request to the right decoder layout (single
  contract, fixed list, factory, topic0-only, several ABIs, one or many tables).
- All four skills are rewritten for the agent that runs them. Each is a short
  list of numbered steps that end on a condition the agent can check ("Done
  when the slug answers 200"), with chain-specific and target-specific detail
  in references that load only when needed. The skills take less context
  (`portal` 499 lines to 183, `migrate-to-portal` 481 to 84, `pipes-sdk` 294 to
  194) and an agent follows the same process on every run.
- `portal` reads the MCP tool catalog from the live server (`sqd://tools`)
  instead of a table that went stale with each server release, continues a
  Stream API response that ends before `toBlock`, and tells the user when a
  dataset is retired or has an announced end date instead of substituting a
  similar name.
- `migrate-to-portal` keeps the steps both chains share in `SKILL.md` and moves
  the EVM and Solana procedures into one reference each. It ends on three
  checks (no v2 code left, a clean type-check, a local run that processes
  blocks), and covers what changed upstream: Portal clients retry for about
  five minutes by default from `@subsquid/evm-stream` 0.1.4 and
  `@subsquid/solana-stream` 1.2.1, the `@subsquid/squid-sdk` fallback data
  source fails over between Portal and RPC, and a dedicated Portal takes its
  key in an `x-api-key` header.
- `pipes-sdk` covers Pipes SDK 1.0.0-beta.7 to beta.11 and CLI 1.0.0-beta.3:
  `store.removeRowsAfter` in ClickHouse rollbacks, `program` on the Solana
  instruction decoder, the `mockPortal` test helper, the stalled-response
  watchdog, and the coded errors the SDK now raises at startup (`E0003`,
  `E0004`, `E1006`, `E2321`, `E2411`, `E2426`).
- `squid-perf` explains how to read its report: what each of the three times
  means, where a sync is considered finished, and what each warning says about
  the numbers next to it.
- `AGENTS.md` describes how to write a skill for this repository: a
  description that lists one trigger per case, steps with completion criteria,
  one source for each fact, and instructions phrased as the behaviour wanted.

### Fixed

- `pipes-sdk` version notes match the npm registry on 2026-11-11:
  `@subsquid/pipes` 1.0.0-beta.11 and `@subsquid/pipes-cli` 1.0.0-beta.3 are
  both the `latest` tag, and a generated project pins `^1.0.0-beta.10`. The
  warning that `pipes-cli@latest` is a stale alpha is gone because it no longer
  is.
- The Portal dataset catalog matches the live catalog on 2026-11-11: 106 public
  entries, 34 of them real-time (Katana joined). Moonbeam, Moonriver, Polygon
  zkEVM, Taiko, Blast, Abstract, Gravity Alpha, Enjin and the legacy testnets
  retired since September moved to a dated retirement list, and the
  repository no longer quotes a network count that drifts.
- `pipes-sdk` handles a break in new `custom` EVM projects: CLI 1.0.0-beta.3
  generates contract types with typegen 5, which the generated project cannot
  load (`ERR_MODULE_NOT_FOUND` on the first run). The skill regenerates them
  with typegen 4.6.0 before starting the indexer. Reported upstream as
  [subsquid/pipes-sdk#220](https://github.com/subsquid/pipes-sdk/issues/220).
- `portal` Substrate examples for Frontier EVM logs use Astar; they used
  Moonbeam, whose datasets retired on 2026-09-22.
- `migrate-to-portal` no longer offers a gateway API key as a way to keep a
  Solana squid on v2. The Solana v2 gateway has held only the last 30 days of
  data since 2026-06-01, so the skill sends Solana squids to Portal.
- The `squid-sdk` README no longer claims an MIT license or a v2 API-key step
  for Solana; both now match the skills and the repository license.

## August 28, 2026 — v1.0.0

### New

- Published the initial set of four SQD agent skills: `pipes-sdk` for building
  and deploying indexers, `portal` for querying blockchain data across 140+
  networks, `migrate-to-portal` for moving a v2 Squid onto Portal, and
  `squid-perf` for comparing indexer sync times.
- Skills can now be pinned to an exact release instead of tracking whatever is
  on `main`:

  ```bash
  npx skills add subsquid-labs/skills#v1.0.0
  npx skills add subsquid-labs/skills#v1.0.0@portal
  ```

- Every release now attaches a `sqd-skills.tar.gz` bundle of all four skills,
  always reachable at
  `https://github.com/subsquid-labs/skills/releases/latest/download/sqd-skills.tar.gz`.
- Each release lists the exact skill versions it contains, so a release answers
  which version of a given skill you are installing.
