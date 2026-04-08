import { event, indexed } from '@subsquid/evm-abi'
import * as p from '@subsquid/evm-codec'

export const uniswapV4PoolManagerInitialize = event(
  '0xdd466e674ea557f56295e2d0218a125ea4b4f0f6f3307b95f85e6110838d6438'.toLowerCase(),
  'Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)',
  {
    id: indexed(p.bytes32),
    currency0: indexed(p.address),
    currency1: indexed(p.address),
    fee: p.uint24,
    tickSpacing: p.int24,
    hooks: p.address,
    sqrtPriceX96: p.uint160,
    tick: p.int24,
  },
)

export const uniswapV4PoolManagerModifyLiquidity = event(
  '0xf208f4912782fd25c7f114ca3723a2d5dd6f3bcc3ac8db5af63baa85f711d5ec'.toLowerCase(),
  'ModifyLiquidity(bytes32,address,int24,int24,int256,bytes32)',
  {
    id: indexed(p.bytes32),
    sender: indexed(p.address),
    tickLower: p.int24,
    tickUpper: p.int24,
    liquidityDelta: p.int256,
    salt: p.bytes32,
  },
)

export const uniswapV4PoolManagerSwap = event(
  '0x40e9cecb9f5f1f1c5b9c97dec2917b7ee92e57ba5563708daca94dd84ad7112f'.toLowerCase(),
  'Swap(bytes32,address,int128,int128,uint160,uint128,int24,uint24)',
  {
    id: indexed(p.bytes32),
    sender: indexed(p.address),
    amount0: p.int128,
    amount1: p.int128,
    sqrtPriceX96: p.uint160,
    liquidity: p.uint128,
    tick: p.int24,
    fee: p.uint24,
  },
)

