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

- `portal` now routes Tron questions to the `portal_tron_query_logs` and
  `portal_tron_query_transactions` MCP tools and EVM internal-call questions to
  `portal_evm_query_traces`, and points at the server's `sqd://investigations`
  workflow guide. The catalog notes match Portal MCP server 0.8.5 (28 public
  tools plus 3 debug tools).
- `pipes-sdk` connection examples use injected credentials or protected client files,
  and diagnostics keep secret values out of terminal output.
- `pipes-sdk` and `portal` validate fetched data before using it in tool requests;
  custom ABI generation uses reviewed local JSON inputs.
- Every skill declares its Apache-2.0 license in its frontmatter, so a skill
  installed on its own carries its license terms.
- `migrate-to-portal` and `squid-perf` describe their triggers more precisely,
  and `migrate-to-portal` links to the current documentation URLs instead of
  redirecting ones.

### Fixed

- `pipes-sdk` version notes match the npm registry on 2026-09-10: the `alpha`
  tag resolves to 1.0.0-alpha.25 and the generated caret range installs
  1.0.0-beta.6.
- The Portal dataset catalog snapshot matches the live catalog on 2026-09-10
  (139 public entries, `hashkey-mainnet` added), and the network count is the
  same everywhere in the repository.
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
