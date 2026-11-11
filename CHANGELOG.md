# Changelog

What changed in each release of the SQD agent skills, newest first. Entries
describe what changed for you as a user of the skills; the full commit-level
detail lives in the auto-generated section of each
[GitHub release](https://github.com/subsquid-labs/skills/releases).

## Unreleased

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
  193) and an agent follows the same process on every run.
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
