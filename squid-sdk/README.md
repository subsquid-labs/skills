# Squid SDK Agent Skills

Skills for AI coding agents working with the [Squid SDK](https://docs.sqd.dev) - a production-grade blockchain indexing framework.

## Installation

```bash
npx skills add subsquid-labs/agent-skills/squid-sdk --all
```

## Skills

### squid-perf

Compare sync-time performance across one or more Squid SDK deployments. Fetches logs via the `sqd` CLI, parses per-service progress, and generates a self-contained HTML report plus a Markdown summary with wall-clock / active-time / downtime breakdowns at log-spaced block breakpoints. Also supports single-indexer mode (metrics only, no comparison).

**Invoke:** `/squid-perf`

**What it reports:**
- **Wall-clock elapsed** (headline), **active processing time** (excludes gaps > 120s), and **downtime** (wall − active) at 10 evenly-spaced breakpoints across each service's sync range.
- Tier 1 metrics from `sqd:processor` / `sqd:batch-processor` progress lines (current block, target, rate, items/sec, ETA).
- Tier 2 signals: `sqd:multicall` latency, restart detection, ERROR/WARN lines.
- Tier 3: auto-discovered logger namespaces rendered as count/mean/median/p95 tables.
- Per-service comparison tables for services present in every deployment; "solo metrics" section (with warning) for services present in only some.

**Install just this skill:**
```bash
npx skills add subsquid-labs/agent-skills/squid-sdk/squid-perf
```

[**See skill details →**](./squid-perf/SKILL.md)

## Resources

- **Squid SDK Documentation**: [docs.sqd.dev](https://docs.sqd.dev)
- **SQD**: [sqd.dev](https://sqd.dev)

## License

MIT
