/*
    Two decoders for multiple contract types, multiple events, factory pattern, custom event processing function, one target table.
*/

import 'dotenv/config'
import path from 'node:path'

import { createClient } from '@clickhouse/client'
import { z } from 'zod'

import { evmDecoder, evmPortalStream, contractFactory, contractFactoryStore } from '@subsquid/pipes/evm'
import { clickhouseTarget } from '@subsquid/pipes/targets/clickhouse'

import {
  uniswapV2FactoryPairCreated,
  uniswapV2PairBurn,
  uniswapV2PairMint,
  uniswapV2PairSwap,
  uniswapV2PairSync,
} from './contracts/uniswapV2.js'
import {
  uniswapV3FactoryPoolCreated,
  uniswapV3PoolBurn,
  uniswapV3PoolCollect,
  uniswapV3PoolMint,
  uniswapV3PoolSwap,
} from './contracts/uniswapV3.js'
import { decodedToDbLiqEvent } from './common.js'
import { DbLiquidityEvent } from './types.js'

const env = z
  .object({
    CLICKHOUSE_USER: z.string(),
    CLICKHOUSE_PASSWORD: z.string(),
    CLICKHOUSE_URL: z.string(),
    CLICKHOUSE_DATABASE: z.string(),
  })
  .parse(process.env)

function serializeJsonWithBigInt(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
}

// ============================
// Hardcoded Base Uniswap v2/v3 factory addresses
// ============================
const UNISWAP_V2_FACTORY_BASE = '0x8909dc15e40173ff4699343b6eb8132c65e18ec6'.toLowerCase()
const UNISWAP_V3_FACTORY_BASE = '0x33128a8fc17869897dce68ed026d694621f6fdfd'.toLowerCase()

async function main() {
  const factoryDbPath = path.join(process.cwd(), 'factory.sqlite')
  const database = contractFactoryStore({ path: factoryDbPath });

  // first create decoders for each Uniswap protocol. Each have different start block.
  const uniswapV2Decoder = evmDecoder({
    range: { from: '6601915' },
    contracts: contractFactory({
      address: UNISWAP_V2_FACTORY_BASE,
      event: uniswapV2FactoryPairCreated,
      childAddressField: 'pair',
      database,
    }),
    events: {
      mints: uniswapV2PairMint,
      burns: uniswapV2PairBurn,
      syncs: uniswapV2PairSync,
      swaps: uniswapV2PairSwap,
    },
  });

  const uniswapV3Decoder = evmDecoder({
    range: { from: '1371680' },
    contracts: contractFactory({
      address: UNISWAP_V3_FACTORY_BASE,
      event: uniswapV3FactoryPoolCreated,
      childAddressField: 'pool',
      database,
    }),
    events: {
      burns: uniswapV3PoolBurn,
      collects: uniswapV3PoolCollect,
      mints: uniswapV3PoolMint,
      swaps: uniswapV3PoolSwap,
    },
  });

  await evmPortalStream({
    id: 'uniswap-liquidity-events-base',
    portal: 'https://portal.sqd.dev/datasets/base-mainnet',
    outputs: {
      v2: uniswapV2Decoder,
      v3: uniswapV3Decoder,
    },
  }).pipe({
    transform: (data) => {
      const res: DbLiquidityEvent[] = [];

      // Uniswap V2
      const uniswapV2 = data.v2;
      const v2_swaps = uniswapV2.swaps.map(
        (e) =>
          [
            {
              ...e,
              event: {
                amount0: e.event.amount0In ? e.event.amount0In : -e.event.amount0Out,
                amount1: e.event.amount1In ? e.event.amount1In : -e.event.amount1Out,
              },
            },
            'swap',
          ] as const,
      );
      const v2_syncs = uniswapV2.syncs.map(
        (e) =>
          [
            {
              ...e,
              event: {
                amount0: e.event.reserve0,
                amount1: e.event.reserve1,
              },
            },
            'sync',
          ] as const,
      );
      const v2 = [
        ...uniswapV2.burns.map((e) => [e, 'burn'] as const),
        ...uniswapV2.mints.map((e) => [e, 'mint'] as const),
        ...v2_swaps,
        ...v2_syncs,
      ];
      const v2_res: DbLiquidityEvent[] = v2.map((e) =>
        decodedToDbLiqEvent(e[0], e[1], 'uniswap_v2'),
      );
      res.push(...v2_res);

      // Uniswap V3
      const uniswapV3 = data.v3;
      const v3 = [
        ...uniswapV3.burns.map((e) => [e, 'burn'] as const),
        ...uniswapV3.collects.map((e) => [e, 'collect'] as const),
        ...uniswapV3.mints.map((e) => [e, 'mint'] as const),
        ...uniswapV3.swaps.map((e) => [e, 'swap'] as const),
      ].filter((e) => e[0].event.amount0 || e[0].event.amount1);

      const v3_res: DbLiquidityEvent[] = v3.map((e) =>
        decodedToDbLiqEvent(e[0], e[1], 'uniswap_v3'),
      );
      res.push(...v3_res);

      return res;      
    }
  }).pipeTo(
    clickhouseTarget({
      client: createClient({
        username: env.CLICKHOUSE_USER,
        password: env.CLICKHOUSE_PASSWORD,
        url: env.CLICKHOUSE_URL,
        database: env.CLICKHOUSE_DATABASE,
        json: { stringify: serializeJsonWithBigInt },
        clickhouse_settings: {
          date_time_input_format: 'best_effort',
          date_time_output_format: 'iso',
          output_format_json_named_tuples_as_objects: 1,
          output_format_json_quote_64bit_floats: 1,
          output_format_json_quote_64bit_integers: 1,
        },
      }),
      onStart: async ({ store }) => {
        const migrationsDir = path.join(process.cwd(), 'migrations')
        await store.executeFiles(migrationsDir)
      },
      onData: async ({ data, store }) => {
          await store.insert({
            table: 'liquidity_events_raw',
            values: data,
            format: 'JSONEachRow',
          })
      },
      onRollback: async ({ safeCursor, store }) => {
        await store.removeAllRows({
          tables: ['liquidity_events_raw'],
          where: 'block_number > {latest:UInt32}',
          params: { latest: safeCursor.number },
        })
      },
    }),
  )
}

void main()
