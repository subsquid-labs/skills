import { event, indexed } from '@subsquid/evm-abi'
import * as p from '@subsquid/evm-codec'

export const uniswapV3FactoryPoolCreated = event(
  '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118'.toLowerCase(),
  'PoolCreated(address,address,uint24,int24,address)',
  {
    token0: indexed(p.address),
    token1: indexed(p.address),
    fee: indexed(p.uint24),
    tickSpacing: p.int24,
    pool: p.address,
  },
)

export const uniswapV3PoolBurn = event(
  '0x0c396cd989a39f4459b5fa1aed6a9a8dcdbc45908acfd67e028cd568da98982c'.toLowerCase(),
  'Burn(address,int24,int24,uint128,uint256,uint256)',
  {
    owner: indexed(p.address),
    tickLower: indexed(p.int24),
    tickUpper: indexed(p.int24),
    amount: p.uint128,
    amount0: p.uint256,
    amount1: p.uint256,
  },
)

export const uniswapV3PoolCollect = event(
  '0x70935338e69775456a85ddef226c395fb668b63fa0115f5f20610b388e6ca9c0'.toLowerCase(),
  'Collect(address,address,int24,int24,uint128,uint128)',
  {
    owner: indexed(p.address),
    recipient: p.address,
    tickLower: indexed(p.int24),
    tickUpper: indexed(p.int24),
    amount0: p.uint128,
    amount1: p.uint128,
  },
)

export const uniswapV3PoolMint = event(
  '0x7a53080ba414158be7ec69b987b5fb7d07dee101fe85488f0853ae16239d0bde'.toLowerCase(),
  'Mint(address,address,int24,int24,uint128,uint256,uint256)',
  {
    sender: p.address,
    owner: indexed(p.address),
    tickLower: indexed(p.int24),
    tickUpper: indexed(p.int24),
    amount: p.uint128,
    amount0: p.uint256,
    amount1: p.uint256,
  },
)

export const uniswapV3PoolSwap = event(
  '0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67'.toLowerCase(),
  'Swap(address,address,int256,int256,uint160,uint128,int24)',
  {
    sender: indexed(p.address),
    recipient: indexed(p.address),
    amount0: p.int256,
    amount1: p.int256,
    sqrtPriceX96: p.uint160,
    liquidity: p.uint128,
    tick: p.int24,
  },
)

