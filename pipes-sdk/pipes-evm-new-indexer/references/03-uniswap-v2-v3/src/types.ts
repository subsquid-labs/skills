import { FactoryEvent } from "@subsquid/pipes/evm";

export type LiqEventType =
  | 'mint'
  | 'burn'
  | 'swap'
  | 'collect'
  | 'sync'
  | 'fees'
  | 'initialize_v4'
  | 'modify_liquidity_v4';

// event inserted in the DB, same structure
export type DbLiquidityEvent = {
  timestamp: number;
  pool_address: string;
  event_type: LiqEventType;
  token_a: string;
  token_b: string;
  amount_a_raw: bigint;
  amount_b_raw: bigint;
  tick_spacing: number;
  tick: number;
  tick_lower: number;
  tick_upper: number;
  liquidity: bigint;
  liquidity_delta: bigint;
  sqrt_price_x96: bigint;
  fee: number;
  factory_address: string;
  dex_name: string;
  protocol: string;
  block_number: number;
  transaction_index: number;
  log_index: number;
  transaction_hash: string;
  a_b_swapped: boolean;
  sign: number;
};

// event provided by EVM decoder
export type DecodedLiqEvent = {
  contract: string;
  timestamp: Date;
  event: {
    readonly amount0: bigint;
    readonly amount1: bigint;
  };
  factory?:
    | FactoryEvent<{
        readonly token0: string;
        readonly token1: string;
      }>
    | undefined;
  rawEvent: {
    logIndex: number;
    transactionIndex: number;
    transactionHash: string;
    address: string;
    data: string;
    topics: string[];
};
  block: {
    number: number;
  };
};
