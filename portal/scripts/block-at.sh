#!/usr/bin/env bash
# block-at.sh <dataset-slug> <query-type> <unix-seconds>
# Prints the first block whose header timestamp is at or after the given time.
set -euo pipefail
P=https://portal.sqd.dev/datasets/$1; TYPE=$2; T=$3
req() {  # resend after Portal's 529, which always carries Retry-After
  local out
  while :; do
    out=$(curl -sS --compressed -w '\n%{http_code}' "$@")
    [ "${out##*$'\n'}" = 529 ] && { sleep 10; continue; }
    printf '%s' "${out%$'\n'*}"; return
  done
}
ts() {   # header timestamp, in seconds, of the first block at or after $1
  local t
  t=$(req -X POST "$P/stream" -H 'content-type: application/json' -d "{\"type\":\"$TYPE\",\"fromBlock\":$1,\"toBlock\":$(($1 + 50)),\"includeAllBlocks\":true,\"fields\":{\"block\":{\"number\":true,\"timestamp\":true}}}" | head -1 | jq -r .header.timestamp)
  [ "$t" -gt 100000000000 ] && t=$((t / 1000))   # Hyperliquid, Tron and Substrate headers are in milliseconds
  echo "$t"
}
lo=$(req "$P/metadata" | jq -r .start_block); hi=$(req "$P/head" | jq -r .number)
while [ "$lo" -lt "$hi" ]; do
  mid=$(((lo + hi) / 2))
  if [ "$(ts "$mid")" -ge "$T" ]; then hi=$mid; else lo=$((mid + 1)); fi
done
echo "$lo"
