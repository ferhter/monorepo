import { ethers } from 'ethers'

import { FundingRoundFactory } from './abi'
import { CHAIN_INFO } from '@/plugins/Web3/constants/chains'

export const staticRoundsBaseUrl = process.env.VUE_APP_STATIC_ROUNDS_BASE_URL
export const staticRoundsFilename = staticRoundsBaseUrl
  ? process.env.VUE_APP_STATIC_ROUNDS_FILENAME || 'rounds.json'
  : undefined

export const mainnetProvider = new ethers.providers.StaticJsonRpcProvider(
  process.env.VUE_APP_ETHEREUM_MAINNET_API_URL
)
export const provider = new ethers.providers.StaticJsonRpcProvider(
  process.env.VUE_APP_ETHEREUM_API_URL
)
export const chainId = Number(process.env.VUE_APP_ETHEREUM_API_CHAINID)
export const chain = CHAIN_INFO[chainId]
if (!chain) throw new Error('invalid chain id')
export const ipfsGatewayUrl = process.env.VUE_APP_IPFS_GATEWAY_URL
export const gunPeers: string[] = process.env.VUE_APP_GUN_PEERS
  ? process.env.VUE_APP_GUN_PEERS.split(',')
  : []

export const ipfsPinningUrl = process.env.VUE_APP_IPFS_PINNING_URL
if (!ipfsPinningUrl) throw new Error('invalid ipfs pinning url')
export const ipfsPinningJwt = process.env.VUE_APP_IPFS_PINNING_JWT
export const ipfsApiKey = process.env.VUE_APP_IPFS_API_KEY
export const ipfsSecretApiKey = process.env.VUE_APP_IPFS_SECRET_API_KEY
if (!ipfsPinningJwt && !(ipfsApiKey && ipfsSecretApiKey)) {
  throw new Error(
    'Please setup environment variables for ' +
      'VUE_APP_IPFS_API_KEY and VUE_APP_IPFS_SECRET_API_KEY or VUE_APP_IPFS_PINNING_JWT'
  )
}

//TODO: need to be able to pass the factory contract address dynamically, note all places this is used make factory address a parameter that defaults to the env. variable set
//NOTE: these calls will be replaced by subgraph queries eventually.
export const factory = new ethers.Contract(
  process.env.VUE_APP_CLRFUND_FACTORY_ADDRESS as string,
  FundingRoundFactory,
  provider
)
export const userRegistryType = process.env.VUE_APP_USER_REGISTRY_TYPE
export enum UserRegistryType {
  BRIGHT_ID = 'brightid',
  SIMPLE = 'simple',
}
if (
  ![UserRegistryType.BRIGHT_ID, UserRegistryType.SIMPLE].includes(
    userRegistryType as UserRegistryType
  )
) {
  throw new Error('invalid user registry type')
}
export const recipientRegistryType = process.env.VUE_APP_RECIPIENT_REGISTRY_TYPE
if (
  !['simple', 'optimistic', 'kleros'].includes(recipientRegistryType as string)
) {
  throw new Error('invalid recipient registry type')
}
export const recipientRegistryPolicy =
  process.env.VUE_APP_RECIPIENT_REGISTRY_POLICY
export const operator: string = process.env.VUE_APP_OPERATOR || 'Clr.fund'

export const SUBGRAPH_ENDPOINT =
  process.env.VUE_APP_SUBGRAPH_URL ||
  'https://api.thegraph.com/subgraphs/name/clrfund/clrfund'

// application theme
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
}

// the number of records per batch in the `pending submissions` export file
export const exportBatchSize =
  Number(process.env.VUE_APP_EXPORT_BATCH_SIZE) || 60

export const brightIdSponsorKey = process.env.VUE_APP_BRIGHTID_SPONSOR_KEY
export const brightIdNodeUrl =
  process.env.VUE_APP_BRIGHTID_NODE_URL ||
  'https://brightid.clr.fund/brightid/v6'

export const brightIdSponsorUrl = process.env.VUE_APP_BRIGHTID_SPONSOR_API_URL

export const MAX_WAIT_DEPTH = Number(process.env.VUE_APP_MAX_WAIT_DEPTH) || 15
