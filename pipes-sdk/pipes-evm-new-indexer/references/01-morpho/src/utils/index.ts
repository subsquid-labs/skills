import { DecodedEvent } from "@subsquid/pipes/evm"

export type SnakeCase<S extends string> = S extends `${infer H}${infer T}`
  ? `${H extends Lowercase<H> ? H : `_${Lowercase<H>}`}${SnakeCase<T>}`
  : S

export type SnakeTopKeys<T> = T extends object ? { [K in keyof T as K extends string ? SnakeCase<K> : K]: T[K] } : T

export const toSnakeKeys = <T extends Record<string, any>>(obj: T): SnakeTopKeys<T> => {
  const toSnake = (k: string) => k.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toSnake(k), v])) as SnakeTopKeys<T>
}

export const toSnakeKeysArray = <T extends Record<string, any>>(obj: T[]): SnakeTopKeys<T>[] => {
  return obj.map((o) => toSnakeKeys(o))
}

export function serializeJsonWithBigInt(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => (typeof value === 'bigint' ? value.toString() : value))
}

type TxMeta = {
  blockNumber: number
  txHash: string
  txIndex: number
  logIndex: number
  timestamp: number
}

function flatten<T extends DecodedEvent>(arr: T[]): (T['event'] & TxMeta)[] {
  return arr.map((e) => ({
    ...e.event,
    blockNumber: e.block.number,
    txHash: e.rawEvent.transactionHash,
    txIndex: e.rawEvent.transactionIndex,
    logIndex: e.rawEvent.logIndex,
    timestamp: e.timestamp.getTime() / 1000,
  }))
}

export function transform<T extends DecodedEvent>(
  arr: T[],
): SnakeTopKeys<T['event'] & TxMeta>[] {
  return toSnakeKeysArray(flatten(arr))
}
