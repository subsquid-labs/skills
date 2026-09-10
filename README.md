# SQD Agent Skills

A collection of skills for AI coding agents working with SQD products. Skills extend agent capabilities for querying Portal data, choosing the right SQD data surface, and building, deploying, and optimizing blockchain indexers and data pipelines.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Skills

| Skill | Use Case |
|-------|----------|
| [**pipes-sdk**](./pipes-sdk/) | Build, configure, deploy, and troubleshoot durable blockchain indexers with the Pipes SDK (EVM, Solana, Tron, Bitcoin, Hyperliquid) |
| [**portal**](./portal/) | Query blockchain data across 130+ networks (EVM, Solana, Substrate, Bitcoin, Tron, Hyperliquid) and choose between Portal MCP, Portal Stream API/curl, or Pipes/Squid |
| [**migrate-to-portal**](./squid-sdk/migrate-to-portal/) | Migrate an existing Squid SDK indexer (EVM or Solana) off the v2 gateway onto Portal |
| [**squid-perf**](./squid-sdk/squid-perf/) | Compare indexer sync-time performance across runs |

## Installation

**Install all skills:**
```bash
npx skills add subsquid-labs/skills --all --full-depth
```

(`--full-depth` matters: two skills live one directory down, and the skills CLI
only finds them with it.)

**Install individually:**
```bash
npx skills add subsquid-labs/skills/pipes-sdk
npx skills add subsquid-labs/skills/portal
npx skills add subsquid-labs/skills/squid-sdk/migrate-to-portal
npx skills add subsquid-labs/skills/squid-sdk/squid-perf
```

Skills activate automatically once installed — the agent picks the right one based on your task.

**Pin to a release:**

The commands above track `main`. To install an exact, unchanging version, append
a release tag — optionally with `@<skill>` to take a single skill from it:

```bash
npx skills add subsquid-labs/skills#v1.0.0 --full-depth
npx skills add subsquid-labs/skills#v1.0.0@portal
npx skills add subsquid-labs/skills#v1.0.0@squid-perf --full-depth
```

Every release also attaches a bundle of all skills:

```bash
npx skills add https://github.com/subsquid-labs/skills/releases/latest/download/sqd-skills.tar.gz
```

See [Releases](https://github.com/subsquid-labs/skills/releases) for what changed
in each version, or [CHANGELOG.md](./CHANGELOG.md).

## Example Prompts

```
Create a new indexer for USDC transfers on Ethereum
```
```
My indexer crashed with "Cannot read properties of undefined (reading 'topic')"
```
```
Migrate my squid from @subsquid/evm-processor to Portal
```
```
Move my Solana squid off setGateway and onto Portal
```
```
Query all USDC transfers on Base between blocks 10M–11M
```
```
What's the correct Portal dataset name for Arbitrum?
```
```
Show me up to 200 BTC perp fills on Hyperliquid from the past hour
```
```
Track USDT transfers on Tron
```
```
Find all Bitcoin payments to this address in the last month
```
```
Give me a curl command that exports raw Base USDC transfers as NDJSON
```
```
What did this transaction call internally?
```
```
This should become a recurring dashboard - should I use Portal MCP or build an indexer?
```
```
Track BTC/ETH/SOL perpetual futures fills on Hyperliquid
```
```
Why is my indexer syncing slowly?
```

## Resources

- **SQD:** [sqd.dev](https://sqd.dev)
- **Pipes SDK:** [github.com/subsquid-labs/pipes-sdk](https://github.com/subsquid-labs/pipes-sdk)
- **Squid SDK:** [github.com/subsquid/squid-sdk](https://github.com/subsquid/squid-sdk)
- **Documentation:** [docs.sqd.dev](https://docs.sqd.dev)
- **Portal API catalog:** [portal.sqd.dev/datasets](https://portal.sqd.dev/datasets)
- **Agent Skills format:** [agentskills.io](https://agentskills.io/)

## Contributing

Open a focused pull request and validate every changed skill with the `skills-ref` command documented in [AGENTS.md](./AGENTS.md#validation). If your change is user-visible, add an entry under `## Unreleased` in [CHANGELOG.md](./CHANGELOG.md) — see [Releases](./AGENTS.md#releases) for the conventions.

## License

[Apache-2.0](./LICENSE), matching the other SQD repositories.
