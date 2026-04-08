/* 
  Indexes single contract, multiple events, events processed by common function, 3 target tables.
*/

import 'dotenv/config'
import path from 'node:path'
import { createClient } from '@clickhouse/client'
import { DecodedEvent, evmDecoder, evmPortalStream } from '@subsquid/pipes/evm'
import { clickhouseTarget } from '@subsquid/pipes/targets/clickhouse'
import { z } from 'zod'
import { events as morphoBlueEvents } from './contracts/0xBBBBBbbBBb9cc5e90e3b3Af64bDAF62C37EEFFCb.js'
import { type SnakeTopKeys, serializeJsonWithBigInt, toSnakeKeysArray, transform } from './utils/index.js'

const env = z
  .object({
    CLICKHOUSE_USER: z.string(),
    CLICKHOUSE_PASSWORD: z.string(),
    CLICKHOUSE_URL: z.string(),
    CLICKHOUSE_DATABASE: z.string(),
  })
  .parse(process.env)

const custom = evmDecoder({
  range: { from: '18883124' },
  contracts: ['0xBBBBBbbBBb9cc5e90e3b3Af64bDAF62C37EEFFCb'],
  /**
   * Or optionally use pass all events object directly to listen to all contract events
   * ```ts
   * events: myContractEvents,
   * ```
   */
  events: {
    Supply: morphoBlueEvents.Supply,
    Borrow: morphoBlueEvents.Borrow,
    Liquidate: morphoBlueEvents.Liquidate,
  },
});

export async function main() {
  await evmPortalStream({
    id: 'morpho-blue-lending',
    portal: 'https://portal.sqd.dev/datasets/ethereum-mainnet',
    outputs: { custom },
  })
    .pipeTo(
      clickhouseTarget({
        client: createClient({
          username: env.CLICKHOUSE_USER,
          password: env.CLICKHOUSE_PASSWORD,
          url: env.CLICKHOUSE_URL,
          database: env.CLICKHOUSE_DATABASE,
          json: {
            stringify: serializeJsonWithBigInt,
          },
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
            table: 'morpho_blue_supply',
            values: transform(data.custom.Supply),
            format: 'JSONEachRow',
          })
          await store.insert({
            table: 'morpho_blue_borrow',
            values: transform(data.custom.Borrow),
            format: 'JSONEachRow',
          })
          await store.insert({
            table: 'morpho_blue_liquidate',
            values: transform(data.custom.Liquidate),
            format: 'JSONEachRow',
          })
        },
        onRollback: async ({ safeCursor, store }) => {
          await store.removeAllRows({
            tables: ['morpho_blue_supply', 'morpho_blue_borrow', 'morpho_blue_liquidate'],
            where: 'block_number > {latest:UInt32}',
            params: { latest: safeCursor.number },
          })
        },
      }),
    )
}

void main()
