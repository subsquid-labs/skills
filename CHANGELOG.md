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

- `pipes-sdk` connection examples use injected credentials or protected client files,
  and diagnostics keep secret values out of terminal output.
- `pipes-sdk` and `portal` validate fetched data before using it in tool requests;
  custom ABI generation uses reviewed local JSON inputs.

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
