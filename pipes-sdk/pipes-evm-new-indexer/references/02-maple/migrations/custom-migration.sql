CREATE TABLE IF NOT EXISTS maple_pool_flows (
  pool LowCardinality(String),
  pool_name LowCardinality(String),
  event_type LowCardinality(String),
  user FixedString(42),
  assets UInt256,
  shares UInt256,
  block_number UInt32,
  tx_hash String,
  tx_index UInt16,
  log_index UInt16,
  timestamp DateTime CODEC (DoubleDelta, ZSTD),
  sign Int8 DEFAULT toInt8(1)
)
ENGINE = CollapsingMergeTree(sign) PARTITION BY toYYYYMM(timestamp)
ORDER BY (pool, timestamp, tx_index, log_index);
