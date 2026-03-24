---
name: portal-query
description: Query blockchain data across 210+ chains using SQD Portal. Covers EVM logs/transactions/traces, Solana instructions, and Hyperliquid fills with dataset discovery and verification.
allowed-tools: [Bash, WebFetch, WebSearch]
metadata:
  author: subsquid
  version: "3.0.0"
  category: portal-core
---

# Portal: Query Blockchain Data

Query and analyze blockchain data across 210+ chains using the SQD Portal Stream API. Covers all supported data types: EVM logs, transactions, traces, Solana instructions, and Hyperliquid fills.

## When to Use This Skill

Use this skill when you need to:
- Query blockchain event logs, transactions, traces, instructions, or trade fills
- Find the correct Portal dataset name for a blockchain
- Analyze on-chain activity (token transfers, DeFi events, contract deployments, trading)
- Use Portal MCP tools or the raw Stream API

---

## Step 1: Find the Correct Dataset Name

**Portal uses specific naming conventions that differ from common names.**

### Top Chains (Quick Reference)

| Common Name | Portal Dataset Name | Type |
|-------------|-------------------|------|
| Ethereum | `ethereum-mainnet` | EVM |
| Arbitrum | `arbitrum-one` | EVM |
| Base | `base-mainnet` | EVM |
| Optimism | `optimism-mainnet` | EVM |
| Polygon | `polygon-mainnet` | EVM |
| BSC / Binance | `binance-mainnet` | EVM |
| Avalanche | `avalanche-mainnet` | EVM |
| zkSync Era | `zksync-mainnet` | EVM |
| Blast | `blast-l2-mainnet` | EVM |
| Scroll | `scroll-mainnet` | EVM |
| Linea | `linea-mainnet` | EVM |
| Gnosis | `gnosis-mainnet` | EVM |
| Solana | `solana-mainnet` | Solana |
| Hyperliquid Fills | `hyperliquid-fills` | HyperliquidFills |
| HyperEVM | `hyperliquid-mainnet` | EVM |

> **Full mapping:** See `references/dataset-mapping.md` for all 200+ chains including L2s, alt-L1s, and testnets.

### Common Mistakes

```
❌ "ethereum" → Should be "ethereum-mainnet"
❌ "arbitrum" → Should be "arbitrum-one"
❌ "bsc" → Should be "binance-mainnet"
```

### Verify a Dataset Name

```bash
curl -I https://portal.sqd.dev/datasets/{dataset-name}/metadata
# 200 = exists, 404 = wrong name
```

Or use MCP: `portal_list_datasets` with `query: "arbitrum"` to search.

---

## Step 2: Choose Your Data Type

| What You Need | Data Type | Reference | Type Field |
|---|---|---|---|
| Token transfers, DeFi events, NFT activity | **EVM Logs** | `references/evm-logs.md` | `"type": "evm"` |
| Wallet activity, function calls | **EVM Transactions** | `references/evm-transactions.md` | `"type": "evm"` |
| Internal calls, contract deployments | **EVM Traces** | `references/evm-traces.md` | `"type": "evm"` |
| Solana program calls, SPL transfers | **Solana Instructions** | `references/solana.md` | `"type": "solana"` |
| Hyperliquid perpetual fills | **Hyperliquid Fills** | `references/hyperliquid.md` | `"type": "hyperliquidFills"` |

**Each reference file contains:** query structure, filter fields, indexing status, examples, and data-type-specific gotchas.

---

## Step 3: Construct Your Query

All Portal queries use the same endpoint pattern:

```
POST https://portal.sqd.dev/datasets/{dataset-name}/stream
Content-Type: application/json
Accept: application/x-ndjson
```

### Minimal Query Template

```json
{
  "type": "<evm|solana|hyperliquidFills>",
  "fromBlock": <start-block>,
  "toBlock": <end-block>,
  "<data-key>": [{ <filters> }],
  "fields": {
    "<field-key>": { <field-selection> }
  }
}
```

| Data Type | Data Key | Field Key |
|---|---|---|
| EVM Logs | `"logs"` | `"log"` |
| EVM Transactions | `"transactions"` | `"transaction"` |
| EVM Traces | `"traces"` | `"trace"` |
| Solana Instructions | `"instructions"` | `"instruction"` |
| Hyperliquid Fills | `"fills"` | `"fill"` |

### Quick Examples

**EVM: USDC Transfers on Base**
```json
{
  "type": "evm",
  "fromBlock": 10000000, "toBlock": 10000100,
  "logs": [{"address": ["0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"], "topic0": ["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]}],
  "fields": {"log": {"address": true, "topics": true, "data": true, "transactionHash": true}}
}
```
Dataset: `base-mainnet`

**Solana: Jupiter Swaps**
```json
{
  "type": "solana",
  "fromBlock": 250000000, "toBlock": 250001000,
  "instructions": [{"programId": ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"], "d8": ["0x5703feb8e7573909"]}],
  "fields": {"instruction": {"programId": true, "accounts": true, "data": true}}
}
```
Dataset: `solana-mainnet`

**Hyperliquid: BTC Fills**
```json
{
  "type": "hyperliquidFills",
  "fromBlock": 920000000, "toBlock": 920000100,
  "fills": [{"coin": ["BTC"]}],
  "fields": {"fill": {"coin": true, "side": true, "px": true, "sz": true, "user": true, "dir": true}}
}
```
Dataset: `hyperliquid-fills`

> **More examples:** See the reference file for each data type.

---

## MCP Tools Quick Reference

If Portal MCP tools are available, prefer them over raw API calls:

### Discovery & Overview

| Tool | Use Case |
|------|----------|
| `portal_list_datasets` | Search datasets by name, chain type, network type |
| `portal_get_dataset_info` | Get dataset metadata: latest block, start block, tables |
| `portal_get_block_number` | Get current/latest block for a dataset |
| `portal_block_at_timestamp` | Find block number at a specific timestamp |

### EVM Queries

| Tool | Use Case |
|------|----------|
| `portal_query_logs` | Query event logs with address/topic filters |
| `portal_decode_logs` | Auto-decode known events (Transfer, Swap, etc.) |
| `portal_count_events` | Count events by contract or type (~99% smaller) |
| `portal_query_transactions` | Query transactions by sender/recipient/sighash |
| `portal_get_recent_transactions` | Recent txs with auto block calculation |
| `portal_query_traces` | Internal calls, contract deployments |
| `portal_get_erc20_transfers` | ERC20 transfers with optional token info |
| `portal_get_nft_transfers` | ERC721/ERC1155 transfers |
| `portal_get_contract_activity` | Contract interaction stats |
| `portal_get_wallet_summary` | Wallet txs + token transfers in one call |
| `portal_get_top_contracts` | Most active contracts by tx count |

### Solana Queries

| Tool | Use Case |
|------|----------|
| `portal_query_solana_instructions` | Instructions with program/discriminator/account filters |
| `portal_query_solana_transactions` | Transactions by fee payer or account |
| `portal_query_solana_token_balances` | SPL token balance changes |
| `portal_query_solana_balances` | SOL balance changes |
| `portal_query_solana_logs` | Program log messages |

### Hyperliquid Queries

| Tool | Use Case |
|------|----------|
| `portal_query_hyperliquid_fills` | Trade fills by coin, user, direction |

### Analytics

| Tool | Use Case |
|------|----------|
| `portal_aggregate_transfers` | ERC20 transfer volume stats (~98% smaller) |
| `portal_get_time_series` | Bucketed metrics over time (tx count, gas, etc.) |
| `portal_get_gas_analytics` | Gas price analysis with cost estimates |
| `portal_get_transaction_density` | Tx count per block |
| `portal_get_token_info` | Token metadata from CoinGecko |

---

## Response Format

All Portal responses use **JSON Lines** (NDJSON) — one JSON object per line:

```
{"header":{"number":19500000,"hash":"0x...","parentHash":"0x...","timestamp":1234567890}}
{"logs":[...]}
{"transactions":[...]}
```

**Parsing:** Split by newlines, parse each line as JSON. First line is always the block header.

---

## Common Mistakes (All Data Types)

### Wrong Dataset Name
```
POST /datasets/ethereum/stream  ❌
POST /datasets/ethereum-mainnet/stream  ✅
```
Always verify with the mapping table or `portal_list_datasets`.

### Missing `type` Field
```json
{"fromBlock": 19500000, "logs": [{}]}  ❌ — missing "type": "evm"
```
Every query MUST include `type`.

### Wrong `type` for Dataset
- EVM chains (Ethereum, Arbitrum, Base, etc.) → `"type": "evm"`
- Solana → `"type": "solana"`
- Hyperliquid fills → `"type": "hyperliquidFills"`
- HyperEVM (`hyperliquid-mainnet`) → `"type": "evm"` (NOT `"hyperliquidFills"`)

### Too Broad Query
```json
{"fromBlock": 0, "logs": [{}]}  ❌ — millions of results
```
Always add address/topic/programId filters and reasonable block ranges.

---

## Performance Tips

1. **Always filter by address/programId** — 10-100x faster
2. **Add topic0/sighash/discriminator** — another 10x
3. **Use narrow block ranges** when exploring (100-10K blocks)
4. **Request only needed fields** — reduces response size
5. **Use MCP count/aggregate tools** for overview before querying full data

---

## Additional Resources

- **[Available Datasets](https://portal.sqd.dev/datasets)** — Complete list of all 210+ supported networks
- **[llms.txt](https://beta.docs.sqd.dev/llms.txt)** — Quick reference for Portal API
- **[llms-full.txt](https://beta.docs.sqd.dev/llms-full.txt)** — Complete Portal documentation
- **[EVM OpenAPI Schema](https://beta.docs.sqd.dev/en/api/catalog/evm/openapi.yaml)** — EVM API specification
- **[Solana OpenAPI Schema](https://beta.docs.sqd.dev/en/api/catalog/solana/openapi.yaml)** — Solana API specification
- **[Hyperliquid Fills OpenAPI](https://beta.docs.sqd.dev/en/api/catalog/hyperliquid-fills/openapi.yaml)** — Hyperliquid API specification
- **Event Signature Calculator:** https://www.4byte.directory/
- **Function Selector Database:** https://www.4byte.directory/
