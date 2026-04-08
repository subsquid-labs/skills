
CREATE TABLE IF NOT EXISTS morpho_blue_supply (
  -- Event params
  id FixedString(66),
  caller LowCardinality(FixedString(42)),
  on_behalf LowCardinality(FixedString(42)),
  assets UInt256,
  shares UInt256,
  -- Event metadata
  block_number UInt32,
  tx_hash String,
  tx_index UInt16,
  log_index UInt16,
  timestamp DateTime CODEC (DoubleDelta, ZSTD),
  sign Int8  DEFAULT toInt8(1)
)
ENGINE = CollapsingMergeTree(sign) PARTITION BY toYYYYMM(timestamp) -- Data will be split by month
ORDER BY (timestamp, tx_index, log_index);

CREATE TABLE IF NOT EXISTS morpho_blue_borrow (
  -- Event params
  id FixedString(66),
  caller LowCardinality(FixedString(42)),
  on_behalf LowCardinality(FixedString(42)),
  receiver LowCardinality(FixedString(42)),
  assets UInt256,
  shares UInt256,
  -- Event metadata
  block_number UInt32,
  tx_hash String,
  tx_index UInt16,
  log_index UInt16,
  timestamp DateTime CODEC (DoubleDelta, ZSTD),
  sign Int8  DEFAULT toInt8(1)
)
ENGINE = CollapsingMergeTree(sign) PARTITION BY toYYYYMM(timestamp) -- Data will be split by month
ORDER BY (timestamp, tx_index, log_index);

CREATE TABLE IF NOT EXISTS morpho_blue_liquidate (
  -- Event params
  id FixedString(66),
  caller LowCardinality(FixedString(42)),
  borrower LowCardinality(FixedString(42)),
  repaid_assets UInt256,
  repaid_shares UInt256,
  seized_assets UInt256,
  bad_debt_assets UInt256,
  bad_debt_shares UInt256,
  -- Event metadata
  block_number UInt32,
  tx_hash String,
  tx_index UInt16,
  log_index UInt16,
  timestamp DateTime CODEC (DoubleDelta, ZSTD),
  sign Int8  DEFAULT toInt8(1)
)
ENGINE = CollapsingMergeTree(sign) PARTITION BY toYYYYMM(timestamp) -- Data will be split by month
ORDER BY (timestamp, tx_index, log_index);

