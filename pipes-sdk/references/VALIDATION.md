# Data Validation

Run these after a sync, before reporting any number from the table. The SQL is ClickHouse; on PostgreSQL the same checks use `count(*)`, `count(DISTINCT (a, b))` and no `FINAL`. Column names follow the CLI's tables (`block_number`, `tx_hash`, `log_index`, `timestamp`); substitute your own.

A clean exit proves nothing about the data. Each check below caught a run that exited 0 with wrong or partial rows.

## 1. Time bounds

```sql
SELECT min(timestamp), max(timestamp), min(block_number), max(block_number), count() FROM <table>;
```

Pass: both timestamps and both blocks fall inside the requested window, and the last row sits near the window's end.

| Result | Cause |
|---|---|
| Year 1970 or 9999 | Timestamp unit mismatch: [SDK_FEATURES.md](SDK_FEATURES.md#timestamp-handling-critical) |
| `max(timestamp)` well short of the window's end | The end block was resolved wrong (Hyperliquid, Tron), or the run stopped early |

## 2. Row identity

Every row has an identity that appears once:

| Chain | Identity |
|---|---|
| EVM logs | `(tx_hash, log_index)` |
| Solana instructions | `(block_number, transaction_index, instruction_address)` |
| Hyperliquid fills | `(block_number, fill_index)` |

```sql
SELECT count() AS row_count, uniqExact(tuple(tx_hash, log_index)) AS identities FROM <table> FINAL;
```

Pass: the two numbers are equal.

## 3. Formats and empty values

```sql
SELECT
  countIf(NOT match(contract_address, '^0x[0-9a-f]{40}$')) AS bad_addresses,
  countIf(NOT match(tx_hash, '^0x[0-9a-f]{64}$'))          AS bad_hashes,
  countIf(amount = '' OR NOT match(amount, '^-?[0-9]+$'))  AS bad_amounts
FROM <table>;
```

Pass: every count is 0. These are EVM formats; Solana addresses and signatures are base58, and Hyperliquid numbers are floats. An empty amount means a `bigint` reached the row without `.toString()`.

## 4. A bounded window against Portal

Query the same filter over 100 to 1,000 blocks with the **portal** skill's Stream API and compare with the table over the same blocks:

```sql
SELECT count(), uniqExact(tuple(tx_hash, log_index)) FROM <table> FINAL
WHERE block_number BETWEEN <from_block> AND <to_block>;
```

Pass: the counts match, and so does the set of identities. This check shares Portal with the indexer, so it proves the decoder, filters and inserts, and says nothing about Portal itself.

Event tables are sparse: a block with no matching event has no row, so gaps between block numbers are expected.

A factory indexer over a window that starts after the factory's deployment needs one more check: a child known to predate the window has rows. See [PATTERNS.md](PATTERNS.md#contracts-created-by-a-factory).

Hyperliquid: compare by `(block_number, fill_index)`. Counts per response differ because the SDK and Portal batch blocks differently ([Pattern 10](TROUBLESHOOTING.md#error-pattern-10-hyperliquid-validation--sdk-vs-portal-block-batching)).

## 5. One source outside Portal

When the answer matters, check a sample against a source that does not read from Portal:

| Chain | Source | Compare |
|---|---|---|
| EVM | A public RPC: `eth_getLogs` for the contract over 100 to 300 blocks | Count, and the sum of one amount field |
| Solana | `getBlock` on a public RPC for two or three slots | Count of matching instructions, inner ones included |
| Hyperliquid | The exchange's `candleSnapshot` API | Hourly volume inside the candle's range |
| Bitcoin | A block explorer API for one address or block | Count and total value |

Use `curl` for these and for Portal: Portal and several public RPCs answer `403` to Python's default `urllib` client. Free RPC endpoints often refuse `eth_getLogs` on old blocks or rate-limit batches, so try a second provider before giving up, and report the check as not run when none answers.

## Before reporting amounts

- **Token decimals.** On-chain amounts are integers in the token's smallest unit. Read `decimals()` from the token contract (USDC and USDT have 6, WBTC 8, most others 18) and divide. Assuming 18 is off by a factor of a trillion for USDC.
- **Two fills per trade.** Each Hyperliquid trade produces a bid fill and an ask fill. Market volume is `sum(px * sz) / 2`; a user's own volume keeps all of that user's fills.
- **Say what was counted.** State the window in UTC with its first and last block, and what one row means (a swap, a pool leg, a fill).

## Final checklist

- [ ] Time bounds inside the requested window
- [ ] Row count equals unique identities
- [ ] No malformed addresses, hashes or amounts
- [ ] A bounded window matches Portal by count and identity
- [ ] For a factory indexer, a child older than the window has rows
- [ ] Amounts divided by the token's real decimals
