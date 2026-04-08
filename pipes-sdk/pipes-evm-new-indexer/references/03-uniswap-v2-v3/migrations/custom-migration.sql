-- ============================= MAIN TABLE =========================================================
CREATE TABLE IF NOT EXISTS liquidity_events_raw
(
    pool_address        String,
    timestamp           DateTime CODEC (DoubleDelta, ZSTD),
    event_type          LowCardinality(String),
    token_a             String,
    token_b             String,
    amount_a_raw        Int128,
    amount_b_raw        Int128,
	tick_spacing		Int32,
	tick				Int32,
	tick_lower			Int32,
	tick_upper			Int32,
	liquidity			UInt128,
	liquidity_delta		Int256,
	sqrt_price_x96		UInt256,
	fee					UInt32,
    factory_address     LowCardinality(String),
    dex_name            LowCardinality(String),
    protocol            LowCardinality(String),
    block_number        UInt32 CODEC (DoubleDelta, ZSTD),
    transaction_index   UInt16,
    log_index           UInt16,
    transaction_hash    String,
    a_b_swapped         Bool,   -- if true then originally token_a was token_b in a pool and swapped for convenience
    sign                Int8
) ENGINE = CollapsingMergeTree(sign)
      PARTITION BY toYYYYMM(timestamp)
      ORDER BY (pool_address, timestamp, transaction_index, log_index);
