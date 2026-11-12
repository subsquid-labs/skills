#!/usr/bin/env bash
# block-at.sh <dataset-slug> <query-type> <unix-seconds>
# Prints the first block whose header timestamp is at or after the given time.
# Reads block headers only. Each probe fetches up to 1,000 headers; the next
# probe is placed by the block rate between the two nearest known blocks, with
# a halving step every third probe. Usually 4 to 8 requests.
set -euo pipefail
P=https://portal.sqd.dev/datasets/$1; TYPE=$2; T=$(($3 * 1000))
req() {  # resend after Portal's 529, which always carries Retry-After
  local out
  while :; do
    out=$(curl -sS --compressed -w '\n%{http_code}' "$@")
    [ "${out##*$'\n'}" = 529 ] && { sleep 10; continue; }
    printf '%s' "${out%$'\n'*}"; return
  done
}
probe() {  # headers from block $1 on -> "first-ts last-number last-ts hit", times in ms
  req -X POST "$P/stream" -H 'content-type: application/json' -d "{\"type\":\"$TYPE\",\"fromBlock\":$1,\"toBlock\":$(($1 + 999)),\"includeAllBlocks\":true,\"fields\":{\"block\":{\"number\":true,\"timestamp\":true}}}" |
    jq -rs --argjson T "$T" '
      def ms: if . > 100000000000 then . else . * 1000 end;  # Hyperliquid, Tron and Substrate headers are already in ms
      map(.header | {number, t: (.timestamp | ms)})
      | "\(.[0].t) \(.[-1].number) \(.[-1].t) \([.[] | select(.t >= $T)][0].number // "-")"'
}
lo=$(req "$P/metadata" | jq -r .start_block); hi=$(req "$P/head" | jq -r .number)
read -r thi _ < <(probe "$hi")
[ "$thi" -lt "$T" ] && { echo "time $3 is after the dataset head (block $hi)" >&2; exit 1; }
read -r t0 lo tlo hit < <(probe "$lo")
[ "$t0" -ge "$T" ] && { req "$P/metadata" | jq -r .start_block; exit; }
# From here: block lo is before T, block hi is at or after T.
n=0
while [ "$hit" = - ] && [ $((hi - lo)) -gt 1 ]; do
  n=$((n + 1)); span=$((hi - lo))
  if [ $((n % 3)) -eq 0 ]; then
    mid=$((lo + span / 2))
  else
    est=$((lo + (T - tlo) / 1000 * span / ((thi - tlo) / 1000 + 1))); pad=$((span / 500))
    if [ $((n % 3)) -eq 1 ]; then mid=$((est - pad - 500)); else mid=$((est + pad)); fi
  fi
  [ "$mid" -le "$lo" ] && mid=$((lo + 1)); [ "$mid" -ge "$hi" ] && mid=$((hi - 1))
  read -r t0 last tlast hit < <(probe "$mid")
  [ -n "${BLOCK_AT_TRACE:-}" ] && echo "probe $mid: first $t0, last $last $tlast, hit $hit" >&2
  if [ "$t0" -ge "$T" ]; then hi=$mid; thi=$t0; hit=-; else lo=$last; tlo=$tlast; fi
done
if [ "$hit" = - ]; then echo "$hi"; else echo "$hit"; fi
