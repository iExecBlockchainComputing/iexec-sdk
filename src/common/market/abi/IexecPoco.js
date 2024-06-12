export const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Lock',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'dealid',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'appHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'datasetHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'workerpoolHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'requestHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'volume',
        type: 'uint256',
      },
    ],
    name: 'OrdersMatched',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'ref',
        type: 'bytes32',
      },
    ],
    name: 'Reward',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'workerpool',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'dealid',
        type: 'bytes32',
      },
    ],
    name: 'SchedulerNotice',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'ref',
        type: 'bytes32',
      },
    ],
    name: 'Seize',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Unlock',
    type: 'event',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    name: 'verifySignature',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'verifyPresignature',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    name: 'verifyPresignatureOrSignature',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'app',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'appprice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'volume',
            type: 'uint256',
          },
          {
            internalType: 'bytes32',
            name: 'tag',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'datasetrestrict',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'workerpoolrestrict',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'requesterrestrict',
            type: 'address',
          },
          {
            internalType: 'bytes32',
            name: 'salt',
            type: 'bytes32',
          },
          {
            internalType: 'bytes',
            name: 'sign',
            type: 'bytes',
          },
        ],
        internalType: 'struct IexecLibOrders_v5.AppOrder',
        name: '',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'dataset',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'datasetprice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'volume',
            type: 'uint256',
          },
          {
            internalType: 'bytes32',
            name: 'tag',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'apprestrict',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'workerpoolrestrict',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'requesterrestrict',
            type: 'address',
          },
          {
            internalType: 'bytes32',
            name: 'salt',
            type: 'bytes32',
          },
          {
            internalType: 'bytes',
            name: 'sign',
            type: 'bytes',
          },
        ],
        internalType: 'struct IexecLibOrders_v5.DatasetOrder',
        name: '',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'workerpool',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'workerpoolprice',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'volume',
            type: 'uint256',
          },
          {
            internalType: 'bytes32',
            name: 'tag',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'category',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'trust',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'apprestrict',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'datasetrestrict',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'requesterrestrict',
            type: 'address',
          },
          {
            internalType: 'bytes32',
            name: 'salt',
            type: 'bytes32',
          },
          {
            internalType: 'bytes',
            name: 'sign',
            type: 'bytes',
          },
        ],
        internalType: 'struct IexecLibOrders_v5.WorkerpoolOrder',
        name: '',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'address',
            name: 'app',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'appmaxprice',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'dataset',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'datasetmaxprice',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'workerpool',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'workerpoolmaxprice',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'requester',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'volume',
            type: 'uint256',
          },
          {
            internalType: 'bytes32',
            name: 'tag',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'category',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'trust',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'beneficiary',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'callback',
            type: 'address',
          },
          {
            internalType: 'string',
            name: 'params',
            type: 'string',
          },
          {
            internalType: 'bytes32',
            name: 'salt',
            type: 'bytes32',
          },
          {
            internalType: 'bytes',
            name: 'sign',
            type: 'bytes',
          },
        ],
        internalType: 'struct IexecLibOrders_v5.RequestOrder',
        name: '',
        type: 'tuple',
      },
    ],
    name: 'matchOrders',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
