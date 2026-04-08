import { event, indexed } from '@subsquid/evm-abi'
import * as p from '@subsquid/evm-codec'

export const uniswapV2FactoryPairCreated = event(
  '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9'.toLowerCase(),
  'PairCreated(address,address,address,uint256)',
  {
    token0: indexed(p.address),
    token1: indexed(p.address),
    pair: p.address,
    noname: p.uint256,
  },
)

export const uniswapV2PairBurn = event(
  '0xdccd412f0b1252819cb1fd330b93224ca42612892bb3f4f789976e6d81936496'.toLowerCase(),
  'Burn(address,uint256,uint256,address)',
  {
    sender: indexed(p.address),
    amount0: p.uint256,
    amount1: p.uint256,
    to: indexed(p.address),
  },
)

export const uniswapV2PairMint = event(
  '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f'.toLowerCase(),
  'Mint(address,uint256,uint256)',
  {
    sender: indexed(p.address),
    amount0: p.uint256,
    amount1: p.uint256,
  },
)

export const uniswapV2PairSwap = event(
  '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822'.toLowerCase(),
  'Swap(address,uint256,uint256,uint256,uint256,address)',
  {
    sender: indexed(p.address),
    amount0In: p.uint256,
    amount1In: p.uint256,
    amount0Out: p.uint256,
    amount1Out: p.uint256,
    to: indexed(p.address),
  },
)

export const uniswapV2PairSync = event(
  '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1'.toLowerCase(),
  'Sync(uint112,uint112)',
  {
    reserve0: p.uint112,
    reserve1: p.uint112,
  },
)

