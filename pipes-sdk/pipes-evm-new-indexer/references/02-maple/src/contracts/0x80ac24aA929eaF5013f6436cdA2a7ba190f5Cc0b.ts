import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'
import { ContractBase, event, fun, indexed, viewFun } from '@subsquid/evm-abi'
import * as p from '@subsquid/evm-codec'

export const events = {
  Approval: event(
    '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
    'Approval(address,address,uint256)',
    { owner_: indexed(p.address), spender_: indexed(p.address), amount_: p.uint256 },
  ),
  BootstrapMintPerformed: event(
    '0xc5e0c49c290d3bf655c61fddb46eb9fd8d635737c3119287c40c1c1dd78e771e',
    'BootstrapMintPerformed(address,address,uint256,uint256,uint256)',
    {
      caller_: indexed(p.address),
      receiver_: indexed(p.address),
      assets_: p.uint256,
      shares_: p.uint256,
      bootStrapMintAmount_: p.uint256,
    },
  ),
  Deposit: event(
    '0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7',
    'Deposit(address,address,uint256,uint256)',
    { caller_: indexed(p.address), owner_: indexed(p.address), assets_: p.uint256, shares_: p.uint256 },
  ),
  OwnershipAccepted: event(
    '0x357bdeb5828fa83945f38a88510ce5cd7d628dafb346d767efbc693149fdd97c',
    'OwnershipAccepted(address,address)',
    { previousOwner_: indexed(p.address), newOwner_: indexed(p.address) },
  ),
  PendingOwnerSet: event(
    '0xa86864fa6b65f969d5ac8391ddaac6a0eba3f41386cbf6e78c3e4d6c59eb115f',
    'PendingOwnerSet(address,address)',
    { owner_: indexed(p.address), pendingOwner_: indexed(p.address) },
  ),
  RedemptionRequested: event(
    '0x46949ee51143d5b58e4df83122d6c382a04f7bffbe563f78cd7fa61ee519ec08',
    'RedemptionRequested(address,uint256,uint256)',
    { owner_: indexed(p.address), shares_: p.uint256, escrowedShares_: p.uint256 },
  ),
  SharesRemoved: event(
    '0x4b171f7fc0550bd6b41ba56e9b2b88100206431510ba9427518f3485198db36d',
    'SharesRemoved(address,uint256)',
    { owner_: indexed(p.address), shares_: p.uint256 },
  ),
  Transfer: event(
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    'Transfer(address,address,uint256)',
    { owner_: indexed(p.address), recipient_: indexed(p.address), amount_: p.uint256 },
  ),
  Withdraw: event(
    '0xfbde797d201c681b91056529119e0b02407c7bb96a4a2c75c01fc9667232c8db',
    'Withdraw(address,address,address,uint256,uint256)',
    {
      caller_: indexed(p.address),
      receiver_: indexed(p.address),
      owner_: indexed(p.address),
      assets_: p.uint256,
      shares_: p.uint256,
    },
  ),
  WithdrawRequested: event(
    '0xd72eb5d043f24a0168ae744d5c44f9596fd673a26bf74d9646bff4b844882d14',
    'WithdrawRequested(address,uint256,uint256)',
    { owner_: indexed(p.address), assets_: p.uint256, escrowedShares_: p.uint256 },
  ),
}

export const functions = {
  BOOTSTRAP_MINT: viewFun('0xf1a0e4cb', 'BOOTSTRAP_MINT()', {}, p.uint256),
  DOMAIN_SEPARATOR: viewFun('0x3644e515', 'DOMAIN_SEPARATOR()', {}, p.bytes32),
  PERMIT_TYPEHASH: viewFun('0x30adf81f', 'PERMIT_TYPEHASH()', {}, p.bytes32),
  allowance: viewFun('0xdd62ed3e', 'allowance(address,address)', { _0: p.address, _1: p.address }, p.uint256),
  approve: fun('0x095ea7b3', 'approve(address,uint256)', { spender_: p.address, amount_: p.uint256 }, p.bool),
  asset: viewFun('0x38d52e0f', 'asset()', {}, p.address),
  balanceOf: viewFun('0x70a08231', 'balanceOf(address)', { _0: p.address }, p.uint256),
  balanceOfAssets: viewFun('0x9159b206', 'balanceOfAssets(address)', { account_: p.address }, p.uint256),
  convertToAssets: viewFun('0x07a2d13a', 'convertToAssets(uint256)', { shares_: p.uint256 }, p.uint256),
  convertToExitAssets: viewFun('0x50496cbd', 'convertToExitAssets(uint256)', { shares_: p.uint256 }, p.uint256),
  convertToExitShares: viewFun('0xa58c3eff', 'convertToExitShares(uint256)', { amount_: p.uint256 }, p.uint256),
  convertToShares: viewFun('0xc6e6f592', 'convertToShares(uint256)', { assets_: p.uint256 }, p.uint256),
  decimals: viewFun('0x313ce567', 'decimals()', {}, p.uint8),
  decreaseAllowance: fun(
    '0xa457c2d7',
    'decreaseAllowance(address,uint256)',
    { spender_: p.address, subtractedAmount_: p.uint256 },
    p.bool,
  ),
  deposit: fun('0x6e553f65', 'deposit(uint256,address)', { assets_: p.uint256, receiver_: p.address }, p.uint256),
  depositWithPermit: fun(
    '0x50921b23',
    'depositWithPermit(uint256,address,uint256,uint8,bytes32,bytes32)',
    { assets_: p.uint256, receiver_: p.address, deadline_: p.uint256, v_: p.uint8, r_: p.bytes32, s_: p.bytes32 },
    p.uint256,
  ),
  increaseAllowance: fun(
    '0x39509351',
    'increaseAllowance(address,uint256)',
    { spender_: p.address, addedAmount_: p.uint256 },
    p.bool,
  ),
  manager: viewFun('0x481c6a75', 'manager()', {}, p.address),
  maxDeposit: viewFun('0x402d267d', 'maxDeposit(address)', { receiver_: p.address }, p.uint256),
  maxMint: viewFun('0xc63d75b6', 'maxMint(address)', { receiver_: p.address }, p.uint256),
  maxRedeem: viewFun('0xd905777e', 'maxRedeem(address)', { owner_: p.address }, p.uint256),
  maxWithdraw: viewFun('0xce96cb77', 'maxWithdraw(address)', { owner_: p.address }, p.uint256),
  mint: fun('0x94bf804d', 'mint(uint256,address)', { shares_: p.uint256, receiver_: p.address }, p.uint256),
  mintWithPermit: fun(
    '0x60dd37d9',
    'mintWithPermit(uint256,address,uint256,uint256,uint8,bytes32,bytes32)',
    {
      shares_: p.uint256,
      receiver_: p.address,
      maxAssets_: p.uint256,
      deadline_: p.uint256,
      v_: p.uint8,
      r_: p.bytes32,
      s_: p.bytes32,
    },
    p.uint256,
  ),
  name: viewFun('0x06fdde03', 'name()', {}, p.string),
  nonces: viewFun('0x7ecebe00', 'nonces(address)', { _0: p.address }, p.uint256),
  permit: fun('0xd505accf', 'permit(address,address,uint256,uint256,uint8,bytes32,bytes32)', {
    owner_: p.address,
    spender_: p.address,
    amount_: p.uint256,
    deadline_: p.uint256,
    v_: p.uint8,
    r_: p.bytes32,
    s_: p.bytes32,
  }),
  previewDeposit: viewFun('0xef8b30f7', 'previewDeposit(uint256)', { assets_: p.uint256 }, p.uint256),
  previewMint: viewFun('0xb3d7f6b9', 'previewMint(uint256)', { shares_: p.uint256 }, p.uint256),
  previewRedeem: viewFun('0x4cdad506', 'previewRedeem(uint256)', { shares_: p.uint256 }, p.uint256),
  previewWithdraw: viewFun('0x0a28a477', 'previewWithdraw(uint256)', { assets_: p.uint256 }, p.uint256),
  redeem: fun(
    '0xba087652',
    'redeem(uint256,address,address)',
    { shares_: p.uint256, receiver_: p.address, owner_: p.address },
    p.uint256,
  ),
  removeShares: fun(
    '0x1b8f1830',
    'removeShares(uint256,address)',
    { shares_: p.uint256, owner_: p.address },
    p.uint256,
  ),
  requestRedeem: fun(
    '0x107703ab',
    'requestRedeem(uint256,address)',
    { shares_: p.uint256, owner_: p.address },
    p.uint256,
  ),
  requestWithdraw: fun(
    '0xccc143b8',
    'requestWithdraw(uint256,address)',
    { assets_: p.uint256, owner_: p.address },
    p.uint256,
  ),
  symbol: viewFun('0x95d89b41', 'symbol()', {}, p.string),
  totalAssets: viewFun('0x01e1d114', 'totalAssets()', {}, p.uint256),
  totalSupply: viewFun('0x18160ddd', 'totalSupply()', {}, p.uint256),
  transfer: fun('0xa9059cbb', 'transfer(address,uint256)', { recipient_: p.address, amount_: p.uint256 }, p.bool),
  transferFrom: fun(
    '0x23b872dd',
    'transferFrom(address,address,uint256)',
    { owner_: p.address, recipient_: p.address, amount_: p.uint256 },
    p.bool,
  ),
  unrealizedLosses: viewFun('0x67e2ba23', 'unrealizedLosses()', {}, p.uint256),
  withdraw: fun(
    '0xb460af94',
    'withdraw(uint256,address,address)',
    { assets_: p.uint256, receiver_: p.address, owner_: p.address },
    p.uint256,
  ),
}

export class Contract extends ContractBase {
  BOOTSTRAP_MINT() {
    return this.eth_call(functions.BOOTSTRAP_MINT, {})
  }

  DOMAIN_SEPARATOR() {
    return this.eth_call(functions.DOMAIN_SEPARATOR, {})
  }

  PERMIT_TYPEHASH() {
    return this.eth_call(functions.PERMIT_TYPEHASH, {})
  }

  allowance(_0: AllowanceParams['_0'], _1: AllowanceParams['_1']) {
    return this.eth_call(functions.allowance, { _0, _1 })
  }

  asset() {
    return this.eth_call(functions.asset, {})
  }

  balanceOf(_0: BalanceOfParams['_0']) {
    return this.eth_call(functions.balanceOf, { _0 })
  }

  balanceOfAssets(account_: BalanceOfAssetsParams['account_']) {
    return this.eth_call(functions.balanceOfAssets, { account_ })
  }

  convertToAssets(shares_: ConvertToAssetsParams['shares_']) {
    return this.eth_call(functions.convertToAssets, { shares_ })
  }

  convertToExitAssets(shares_: ConvertToExitAssetsParams['shares_']) {
    return this.eth_call(functions.convertToExitAssets, { shares_ })
  }

  convertToExitShares(amount_: ConvertToExitSharesParams['amount_']) {
    return this.eth_call(functions.convertToExitShares, { amount_ })
  }

  convertToShares(assets_: ConvertToSharesParams['assets_']) {
    return this.eth_call(functions.convertToShares, { assets_ })
  }

  decimals() {
    return this.eth_call(functions.decimals, {})
  }

  manager() {
    return this.eth_call(functions.manager, {})
  }

  maxDeposit(receiver_: MaxDepositParams['receiver_']) {
    return this.eth_call(functions.maxDeposit, { receiver_ })
  }

  maxMint(receiver_: MaxMintParams['receiver_']) {
    return this.eth_call(functions.maxMint, { receiver_ })
  }

  maxRedeem(owner_: MaxRedeemParams['owner_']) {
    return this.eth_call(functions.maxRedeem, { owner_ })
  }

  maxWithdraw(owner_: MaxWithdrawParams['owner_']) {
    return this.eth_call(functions.maxWithdraw, { owner_ })
  }

  name() {
    return this.eth_call(functions.name, {})
  }

  nonces(_0: NoncesParams['_0']) {
    return this.eth_call(functions.nonces, { _0 })
  }

  previewDeposit(assets_: PreviewDepositParams['assets_']) {
    return this.eth_call(functions.previewDeposit, { assets_ })
  }

  previewMint(shares_: PreviewMintParams['shares_']) {
    return this.eth_call(functions.previewMint, { shares_ })
  }

  previewRedeem(shares_: PreviewRedeemParams['shares_']) {
    return this.eth_call(functions.previewRedeem, { shares_ })
  }

  previewWithdraw(assets_: PreviewWithdrawParams['assets_']) {
    return this.eth_call(functions.previewWithdraw, { assets_ })
  }

  symbol() {
    return this.eth_call(functions.symbol, {})
  }

  totalAssets() {
    return this.eth_call(functions.totalAssets, {})
  }

  totalSupply() {
    return this.eth_call(functions.totalSupply, {})
  }

  unrealizedLosses() {
    return this.eth_call(functions.unrealizedLosses, {})
  }
}

/// Event types
export type ApprovalEventArgs = EParams<typeof events.Approval>
export type BootstrapMintPerformedEventArgs = EParams<typeof events.BootstrapMintPerformed>
export type DepositEventArgs = EParams<typeof events.Deposit>
export type OwnershipAcceptedEventArgs = EParams<typeof events.OwnershipAccepted>
export type PendingOwnerSetEventArgs = EParams<typeof events.PendingOwnerSet>
export type RedemptionRequestedEventArgs = EParams<typeof events.RedemptionRequested>
export type SharesRemovedEventArgs = EParams<typeof events.SharesRemoved>
export type TransferEventArgs = EParams<typeof events.Transfer>
export type WithdrawEventArgs = EParams<typeof events.Withdraw>
export type WithdrawRequestedEventArgs = EParams<typeof events.WithdrawRequested>

/// Function types
export type BOOTSTRAP_MINTParams = FunctionArguments<typeof functions.BOOTSTRAP_MINT>
export type BOOTSTRAP_MINTReturn = FunctionReturn<typeof functions.BOOTSTRAP_MINT>

export type DOMAIN_SEPARATORParams = FunctionArguments<typeof functions.DOMAIN_SEPARATOR>
export type DOMAIN_SEPARATORReturn = FunctionReturn<typeof functions.DOMAIN_SEPARATOR>

export type PERMIT_TYPEHASHParams = FunctionArguments<typeof functions.PERMIT_TYPEHASH>
export type PERMIT_TYPEHASHReturn = FunctionReturn<typeof functions.PERMIT_TYPEHASH>

export type AllowanceParams = FunctionArguments<typeof functions.allowance>
export type AllowanceReturn = FunctionReturn<typeof functions.allowance>

export type ApproveParams = FunctionArguments<typeof functions.approve>
export type ApproveReturn = FunctionReturn<typeof functions.approve>

export type AssetParams = FunctionArguments<typeof functions.asset>
export type AssetReturn = FunctionReturn<typeof functions.asset>

export type BalanceOfParams = FunctionArguments<typeof functions.balanceOf>
export type BalanceOfReturn = FunctionReturn<typeof functions.balanceOf>

export type BalanceOfAssetsParams = FunctionArguments<typeof functions.balanceOfAssets>
export type BalanceOfAssetsReturn = FunctionReturn<typeof functions.balanceOfAssets>

export type ConvertToAssetsParams = FunctionArguments<typeof functions.convertToAssets>
export type ConvertToAssetsReturn = FunctionReturn<typeof functions.convertToAssets>

export type ConvertToExitAssetsParams = FunctionArguments<typeof functions.convertToExitAssets>
export type ConvertToExitAssetsReturn = FunctionReturn<typeof functions.convertToExitAssets>

export type ConvertToExitSharesParams = FunctionArguments<typeof functions.convertToExitShares>
export type ConvertToExitSharesReturn = FunctionReturn<typeof functions.convertToExitShares>

export type ConvertToSharesParams = FunctionArguments<typeof functions.convertToShares>
export type ConvertToSharesReturn = FunctionReturn<typeof functions.convertToShares>

export type DecimalsParams = FunctionArguments<typeof functions.decimals>
export type DecimalsReturn = FunctionReturn<typeof functions.decimals>

export type DecreaseAllowanceParams = FunctionArguments<typeof functions.decreaseAllowance>
export type DecreaseAllowanceReturn = FunctionReturn<typeof functions.decreaseAllowance>

export type DepositParams = FunctionArguments<typeof functions.deposit>
export type DepositReturn = FunctionReturn<typeof functions.deposit>

export type DepositWithPermitParams = FunctionArguments<typeof functions.depositWithPermit>
export type DepositWithPermitReturn = FunctionReturn<typeof functions.depositWithPermit>

export type IncreaseAllowanceParams = FunctionArguments<typeof functions.increaseAllowance>
export type IncreaseAllowanceReturn = FunctionReturn<typeof functions.increaseAllowance>

export type ManagerParams = FunctionArguments<typeof functions.manager>
export type ManagerReturn = FunctionReturn<typeof functions.manager>

export type MaxDepositParams = FunctionArguments<typeof functions.maxDeposit>
export type MaxDepositReturn = FunctionReturn<typeof functions.maxDeposit>

export type MaxMintParams = FunctionArguments<typeof functions.maxMint>
export type MaxMintReturn = FunctionReturn<typeof functions.maxMint>

export type MaxRedeemParams = FunctionArguments<typeof functions.maxRedeem>
export type MaxRedeemReturn = FunctionReturn<typeof functions.maxRedeem>

export type MaxWithdrawParams = FunctionArguments<typeof functions.maxWithdraw>
export type MaxWithdrawReturn = FunctionReturn<typeof functions.maxWithdraw>

export type MintParams = FunctionArguments<typeof functions.mint>
export type MintReturn = FunctionReturn<typeof functions.mint>

export type MintWithPermitParams = FunctionArguments<typeof functions.mintWithPermit>
export type MintWithPermitReturn = FunctionReturn<typeof functions.mintWithPermit>

export type NameParams = FunctionArguments<typeof functions.name>
export type NameReturn = FunctionReturn<typeof functions.name>

export type NoncesParams = FunctionArguments<typeof functions.nonces>
export type NoncesReturn = FunctionReturn<typeof functions.nonces>

export type PermitParams = FunctionArguments<typeof functions.permit>
export type PermitReturn = FunctionReturn<typeof functions.permit>

export type PreviewDepositParams = FunctionArguments<typeof functions.previewDeposit>
export type PreviewDepositReturn = FunctionReturn<typeof functions.previewDeposit>

export type PreviewMintParams = FunctionArguments<typeof functions.previewMint>
export type PreviewMintReturn = FunctionReturn<typeof functions.previewMint>

export type PreviewRedeemParams = FunctionArguments<typeof functions.previewRedeem>
export type PreviewRedeemReturn = FunctionReturn<typeof functions.previewRedeem>

export type PreviewWithdrawParams = FunctionArguments<typeof functions.previewWithdraw>
export type PreviewWithdrawReturn = FunctionReturn<typeof functions.previewWithdraw>

export type RedeemParams = FunctionArguments<typeof functions.redeem>
export type RedeemReturn = FunctionReturn<typeof functions.redeem>

export type RemoveSharesParams = FunctionArguments<typeof functions.removeShares>
export type RemoveSharesReturn = FunctionReturn<typeof functions.removeShares>

export type RequestRedeemParams = FunctionArguments<typeof functions.requestRedeem>
export type RequestRedeemReturn = FunctionReturn<typeof functions.requestRedeem>

export type RequestWithdrawParams = FunctionArguments<typeof functions.requestWithdraw>
export type RequestWithdrawReturn = FunctionReturn<typeof functions.requestWithdraw>

export type SymbolParams = FunctionArguments<typeof functions.symbol>
export type SymbolReturn = FunctionReturn<typeof functions.symbol>

export type TotalAssetsParams = FunctionArguments<typeof functions.totalAssets>
export type TotalAssetsReturn = FunctionReturn<typeof functions.totalAssets>

export type TotalSupplyParams = FunctionArguments<typeof functions.totalSupply>
export type TotalSupplyReturn = FunctionReturn<typeof functions.totalSupply>

export type TransferParams = FunctionArguments<typeof functions.transfer>
export type TransferReturn = FunctionReturn<typeof functions.transfer>

export type TransferFromParams = FunctionArguments<typeof functions.transferFrom>
export type TransferFromReturn = FunctionReturn<typeof functions.transferFrom>

export type UnrealizedLossesParams = FunctionArguments<typeof functions.unrealizedLosses>
export type UnrealizedLossesReturn = FunctionReturn<typeof functions.unrealizedLosses>

export type WithdrawParams = FunctionArguments<typeof functions.withdraw>
export type WithdrawReturn = FunctionReturn<typeof functions.withdraw>
