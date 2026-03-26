/*
  Indexes multiple contracts, multiple events, custom function for every event, one target table.
*/
import 'dotenv/config'
import path from 'node:path'
import { createClient } from '@clickhouse/client'
import { evmDecoder, evmPortalStream } from '@subsquid/pipes/evm'
import { clickhouseTarget } from '@subsquid/pipes/targets/clickhouse'
import { z } from 'zod'
import { events as poolEvents } from './contracts/0x80ac24aA929eaF5013f6436cdA2a7ba190f5Cc0b.js'

const env = z
  .object({
    CLICKHOUSE_USER: z.string(),
    CLICKHOUSE_PASSWORD: z.string(),
    CLICKHOUSE_URL: z.string(),
    CLICKHOUSE_DATABASE: z.string(),
  })
  .parse(process.env)

  export function serializeJsonWithBigInt(obj: unknown): string {
    return JSON.stringify(obj, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
  }

// All 3 active Maple Syrup pools share the same ABI (ERC-4626 vault)
const POOLS: Record<string, string> = {
  '0x80ac24aa929eaf5013f6436cda2a7ba190f5cc0b': 'syrupUSDC',
  '0x356b8d89c1e1239cbbb9de4815c39a1474d5ba7d': 'syrupUSDT',
  '0xc39a5a616f0ad1ff45077fa2de3f79ab8eb8b8b9': 'Secured Lending USDC',
}

const poolAddresses = Object.keys(POOLS)

const flows = evmDecoder({
  // syrupUSDC deployed ~May 2024, block ~19800000. Start earlier to catch all pools.
  range: { from: '19500000' },
  contracts: poolAddresses,
  events: {
    deposits: poolEvents.Deposit,
    withdrawals: poolEvents.Withdraw,
  },
}).pipe(({ deposits, withdrawals }) => {
  const rows = [
    ...deposits.map((d) => ({
      pool: d.contract.toLowerCase(),
      pool_name: POOLS[d.contract.toLowerCase()] ?? 'Unknown',
      event_type: 'deposit',
      user: d.event.owner_,
      assets: d.event.assets_,
      shares: d.event.shares_,
      block_number: d.block.number,
      tx_hash: d.rawEvent.transactionHash,
      tx_index: d.rawEvent.transactionIndex,
      log_index: d.rawEvent.logIndex,
      timestamp: Math.floor(new Date(d.timestamp).getTime() / 1000),
      sign: 1,
    })),
    ...withdrawals.map((w) => ({
      pool: w.contract.toLowerCase(),
      pool_name: POOLS[w.contract.toLowerCase()] ?? 'Unknown',
      event_type: 'withdrawal',
      user: w.event.owner_,
      assets: w.event.assets_,
      shares: w.event.shares_,
      block_number: w.block.number,
      tx_hash: w.rawEvent.transactionHash,
      tx_index: w.rawEvent.transactionIndex,
      log_index: w.rawEvent.logIndex,
      timestamp: Math.floor(new Date(w.timestamp).getTime() / 1000),
      sign: 1,
    })),
  ]
  return { flows: rows }
})

export async function main() {
  await evmPortalStream({
    id: 'maple-pool-flows',
    portal: 'https://portal.sqd.dev/datasets/ethereum-mainnet',
    outputs: { flows },
  })
    .pipeTo(
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
          if (data.flows.flows.length > 0) {
            await store.insert({
              table: 'maple_pool_flows',
              values: data.flows.flows,
              format: 'JSONEachRow',
            })
          }
        },
        onRollback: async ({ safeCursor, store }) => {
          await store.removeAllRows({
            tables: ['maple_pool_flows'],
            where: 'block_number > {latest:UInt32}',
            params: { latest: safeCursor.number },
          })
        },
      }),
    )
}

void main()
