# SQD Agent Skills

A collection of skills for AI coding agents working with SQD products. Skills extend agent capabilities for building, deploying, and optimizing blockchain indexers and data pipelines.

Skills follow the [Agent Skills](https://agentskills.io/) format.

## Skills

| Skill | Use Case |
|-------|----------|
| [**pipes-sdk**](./pipes-sdk/) | Build, configure, deploy, and troubleshoot blockchain indexers with the Pipes SDK (EVM, Solana, Hyperliquid) |
| [**portal**](./portal/) | Query blockchain data across 210+ chains via the SQD Portal Stream API |
| [**squid-perf**](./squid-sdk/squid-perf/) | Compare indexer sync-time performance across runs |

## Installation

**Install all skills:**
```bash
npx skills add subsquid-labs/agent-skills --all
```

**Install individually:**
```bash
npx skills add subsquid-labs/agent-skills/pipes-sdk
npx skills add subsquid-labs/agent-skills/portal
npx skills add subsquid-labs/agent-skills/squid-sdk/squid-perf
```

Skills activate automatically once installed — the agent picks the right one based on your task.

## Example Prompts

```
Create a new indexer for USDC transfers on Ethereum
```
```
My indexer crashed with "Cannot read properties of undefined (reading 'topic')"
```
```
Query all USDC transfers on Base between blocks 10M–11M
```
```
What's the correct Portal dataset name for Arbitrum?
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
- **Documentation:** [beta.docs.sqd.dev](https://beta.docs.sqd.dev)
- **Portal API catalog:** [portal.sqd.dev/datasets](https://portal.sqd.dev/datasets)
- **Agent Skills format:** [agentskills.io](https://agentskills.io/)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on adding or editing skills.

## License

MIT
