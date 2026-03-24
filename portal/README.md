# Portal Agent Skills

![Experimental](https://img.shields.io/badge/experimental-blue)

1 skill for AI coding agents working with [SQD Portal](https://portal.sqd.dev) - query blockchain data across 210+ chains without infrastructure.

## Installation

```bash
npx skills add subsquid-labs/agent-skills/portal
```

## Available Skills

| Skill | Use Case |
|-------|----------|
| **portal-query** | Query blockchain data across all supported chains — EVM logs/transactions/traces, Solana instructions, and Hyperliquid fills — with dataset discovery and verification |

## Usage

Skills are automatically available once installed. The agent will use them when relevant tasks are detected.

**Examples:**
```
Query all USDC transfers on Base between blocks 10M-11M
```
```
Find all contracts deployed by 0x123... on Ethereum
```
```
Track Jupiter swap instructions on Solana
```
```
Analyze BTC trading fills on Hyperliquid
```
```
What's the correct Portal dataset name for Arbitrum?
```

## Skill Structure

- `portal-query/SKILL.md` — Unified query guide with dataset discovery, workflow, and MCP tools reference
- `portal-query/references/` — Per-data-type query patterns, examples, and dataset mapping

## Resources

- **Portal API (EVM):** [beta.docs.sqd.dev/en/api/catalog/evm/openapi.yaml](https://beta.docs.sqd.dev/en/api/catalog/evm/openapi.yaml)
- **Portal API (Solana):** [beta.docs.sqd.dev/en/api/catalog/solana/openapi.yaml](https://beta.docs.sqd.dev/en/api/catalog/solana/openapi.yaml)
- **Portal API (Hyperliquid Fills):** [beta.docs.sqd.dev/en/api/catalog/hyperliquid-fills/openapi.yaml](https://beta.docs.sqd.dev/en/api/catalog/hyperliquid-fills/openapi.yaml)
- **AI Development:** [beta.docs.sqd.dev/en/ai/ai-development](https://beta.docs.sqd.dev/en/ai/ai-development)

## License

MIT
