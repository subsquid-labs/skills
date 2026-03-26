---
name: pipes-evm-coding
description: Use it when user wants to create EVM blockchain indexer
compatibility: Requires npm/npx
allowed-tools: [Bash, Read, Write]
metadata:
  author: subsquid
  version: "2.0.0"
  category: core
---

# Pipes: EVM Coding
When user wants to code an EVM indexer from scratch.

# Main instructions.
## Env / boilerplace instructions
1. Do not think of CI/CD, Docker, etc.
1. Use @subsquid/pipes 1.0.0-alpha.1

## Indexer code structure
Indexers can be classified by the following dimensions:
1. CONTRACTS: How many contracts to index (one/multiple).
1. SAME_EVENTS: Is it the same events for all contracts or not.
1. FACTORY: Do you need to listen to events of contracts produced by a factory (e.g. we listen to Uniswap factory "create pool" event and then we listen to these pools' events).
1. MULTIPLE_SINK: Should the data be sunk into one table or multiple tables?
1. ROW_CUSTOM_TRANSFORM: Should row data transformation logic be common or custom.

You have few references (in references folder) you can choose based on what's needed:
### 01-morpho
Indexes single contract, multiple events, events processed by common function, 3 target tables.

### 02-maple 
Indexes multiple contracts, multiple events, custom function for every event, one target table (events from multiple contracts are joined).

### 03-uniswap-v2-v3
Two decoders for multiple contract types, multiple events, factory pattern, custom event processing function, one target table.
Two decoders since we have two types of contracts each with their own set of events.


## To generate events ABI
Import pre-built ABIs for standard token interfaces - no fetching required:

```typescript
import { commonAbis } from "@subsquid/pipes/evm"

// Usage in evmDecoder
events: {
  transfers: commonAbis.erc20.events.Transfer,    // Transfer(from, to, value)
  approvals: commonAbis.erc20.events.Approval,    // Approval(owner, spender, value)
}

// ERC721
events: {
  transfers: commonAbis.erc721.events.Transfer,
}
```

Available in `commonAbis`: `erc20`, `erc721`, `erc1155`

Always generate full events definition as in examples, don't ask for topic.
Use evm-typegen tool. Below is intruction for proxy contract, for regular contract it is much simples – just use contract address.
**If the contract IS a proxy:**
   1. Find the implementation address (Etherscan "Read as Proxy" tab → implementation address)
   2. You will need the **implementation's ABI** for event decoding
   3. But you will use the **proxy's address** in the indexer config (events emit from the proxy)
   4. Plan to run `evm-typegen` against the implementation address AFTER CLI generation:
      ```bash
      npx @subsquid/evm-typegen@latest <project>/src/contracts \
        <IMPLEMENTATION_ADDRESS> --chain-id <CHAIN_ID>
      ```
   5. Then update the import in `src/index.ts` to use the implementation's generated file

## After code-generation step
Try to run the pipe (without providing .env first). It should fail with not found env vars error. If any compile errors, they should be fixed.

## Supplement materials
`references/ABI_GUIDE.md` – how to deal with ABI generation
`references/SCHEMA_GUIDE.md` – how to create Clickhouse schema
`references/RESEARCH_CHECKLIST.md` – If something went wrong
