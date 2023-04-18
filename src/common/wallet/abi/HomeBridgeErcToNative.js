export const abi = [
  {
    constant: true,
    inputs: [
      {
        name: '_message',
        type: 'bytes32',
      },
    ],
    name: 'numMessagesSigned',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_hash',
        type: 'bytes32',
      },
      {
        name: '_index',
        type: 'uint256',
      },
    ],
    name: 'signature',
    outputs: [
      {
        name: '',
        type: 'bytes',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_fee',
        type: 'uint256',
      },
    ],
    name: 'setForeignFee',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_txHash',
        type: 'bytes32',
      },
    ],
    name: 'fixedAssets',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_day',
        type: 'uint256',
      },
    ],
    name: 'totalSpentPerDay',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_fee',
        type: 'uint256',
      },
    ],
    name: 'setHomeFee',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'isInitialized',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_dailyLimit',
        type: 'uint256',
      },
    ],
    name: 'setExecutionDailyLimit',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getCurrentDay',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'requiredBlockConfirmations',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'requiredMessageLength',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'pure',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'executionDailyLimit',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_hash',
        type: 'bytes32',
      },
    ],
    name: 'message',
    outputs: [
      {
        name: '',
        type: 'bytes',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_day',
        type: 'uint256',
      },
    ],
    name: 'totalExecutedPerDay',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_feeManager',
        type: 'address',
      },
    ],
    name: 'setFeeManagerContract',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'signature',
        type: 'bytes',
      },
      {
        name: 'message',
        type: 'bytes',
      },
    ],
    name: 'submitSignature',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'txHash',
        type: 'bytes32',
      },
      {
        name: 'unlockOnForeign',
        type: 'bool',
      },
    ],
    name: 'fixAssetsAboveLimits',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'dailyLimit',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_token',
        type: 'address',
      },
      {
        name: '_to',
        type: 'address',
      },
    ],
    name: 'claimTokens',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_withdrawal',
        type: 'bytes32',
      },
    ],
    name: 'numAffirmationsSigned',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_withdrawal',
        type: 'bytes32',
      },
    ],
    name: 'affirmationsSigned',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_amount',
        type: 'uint256',
      },
    ],
    name: 'withinExecutionLimit',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'executionMaxPerTx',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'requiredSignatures',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'owner',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_message',
        type: 'bytes32',
      },
    ],
    name: 'messagesSigned',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'getAmountToBurn',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getHomeFee',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'validatorContract',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'recipient',
        type: 'address',
      },
      {
        name: 'value',
        type: 'uint256',
      },
      {
        name: 'transactionHash',
        type: 'bytes32',
      },
    ],
    name: 'executeAffirmation',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'deployedAtBlock',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getBridgeInterfacesVersion',
    outputs: [
      {
        name: 'major',
        type: 'uint64',
      },
      {
        name: 'minor',
        type: 'uint64',
      },
      {
        name: 'patch',
        type: 'uint64',
      },
    ],
    payable: false,
    stateMutability: 'pure',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'outOfLimitAmount',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_minPerTx',
        type: 'uint256',
      },
    ],
    name: 'setMinPerTx',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_blockConfirmations',
        type: 'uint256',
      },
    ],
    name: 'setRequiredBlockConfirmations',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_dailyLimit',
        type: 'uint256',
      },
    ],
    name: 'setDailyLimit',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_gasPrice',
        type: 'uint256',
      },
    ],
    name: 'setGasPrice',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_maxPerTx',
        type: 'uint256',
      },
    ],
    name: 'setMaxPerTx',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'feeManagerContract',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'upgradeabilityAdmin',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'minPerTx',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_amount',
        type: 'uint256',
      },
    ],
    name: 'withinLimit',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_maxPerTx',
        type: 'uint256',
      },
    ],
    name: 'setExecutionMaxPerTx',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getFeeManagerMode',
    outputs: [
      {
        name: '',
        type: 'bytes4',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'maxPerTx',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'gasPrice',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_number',
        type: 'uint256',
      },
    ],
    name: 'isAlreadyProcessed',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'pure',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getForeignFee',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    payable: true,
    stateMutability: 'payable',
    type: 'fallback',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'transactionHash',
        type: 'bytes32',
      },
    ],
    name: 'AmountLimitExceeded',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'feeAmount',
        type: 'uint256',
      },
      {
        indexed: true,
        name: 'transactionHash',
        type: 'bytes32',
      },
    ],
    name: 'FeeDistributedFromAffirmation',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'feeAmount',
        type: 'uint256',
      },
      {
        indexed: true,
        name: 'transactionHash',
        type: 'bytes32',
      },
    ],
    name: 'FeeDistributedFromSignatures',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
    ],
    name: 'UserRequestForSignature',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'transactionHash',
        type: 'bytes32',
      },
    ],
    name: 'AffirmationCompleted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'signer',
        type: 'address',
      },
      {
        indexed: false,
        name: 'messageHash',
        type: 'bytes32',
      },
    ],
    name: 'SignedForUserRequest',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'signer',
        type: 'address',
      },
      {
        indexed: false,
        name: 'transactionHash',
        type: 'bytes32',
      },
    ],
    name: 'SignedForAffirmation',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'authorityResponsibleForRelay',
        type: 'address',
      },
      {
        indexed: false,
        name: 'messageHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        name: 'NumberOfCollectedSignatures',
        type: 'uint256',
      },
    ],
    name: 'CollectedSignatures',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'gasPrice',
        type: 'uint256',
      },
    ],
    name: 'GasPriceChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'requiredBlockConfirmations',
        type: 'uint256',
      },
    ],
    name: 'RequiredBlockConfirmationChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'newLimit',
        type: 'uint256',
      },
    ],
    name: 'DailyLimitChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'newLimit',
        type: 'uint256',
      },
    ],
    name: 'ExecutionDailyLimitChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: false,
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_validatorContract',
        type: 'address',
      },
      {
        name: '_dailyLimit',
        type: 'uint256',
      },
      {
        name: '_maxPerTx',
        type: 'uint256',
      },
      {
        name: '_minPerTx',
        type: 'uint256',
      },
      {
        name: '_homeGasPrice',
        type: 'uint256',
      },
      {
        name: '_requiredBlockConfirmations',
        type: 'uint256',
      },
      {
        name: '_blockReward',
        type: 'address',
      },
      {
        name: '_foreignDailyLimit',
        type: 'uint256',
      },
      {
        name: '_foreignMaxPerTx',
        type: 'uint256',
      },
      {
        name: '_owner',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_validatorContract',
        type: 'address',
      },
      {
        name: '_dailyLimit',
        type: 'uint256',
      },
      {
        name: '_maxPerTx',
        type: 'uint256',
      },
      {
        name: '_minPerTx',
        type: 'uint256',
      },
      {
        name: '_homeGasPrice',
        type: 'uint256',
      },
      {
        name: '_requiredBlockConfirmations',
        type: 'uint256',
      },
      {
        name: '_blockReward',
        type: 'address',
      },
      {
        name: '_foreignDailyLimit',
        type: 'uint256',
      },
      {
        name: '_foreignMaxPerTx',
        type: 'uint256',
      },
      {
        name: '_owner',
        type: 'address',
      },
      {
        name: '_feeManager',
        type: 'address',
      },
      {
        name: '_homeFee',
        type: 'uint256',
      },
      {
        name: '_foreignFee',
        type: 'uint256',
      },
    ],
    name: 'rewardableInitialize',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'getBridgeMode',
    outputs: [
      {
        name: '_data',
        type: 'bytes4',
      },
    ],
    payable: false,
    stateMutability: 'pure',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'blockRewardContract',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'totalBurntCoins',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_blockReward',
        type: 'address',
      },
    ],
    name: 'setBlockRewardContract',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
export default { abi };
