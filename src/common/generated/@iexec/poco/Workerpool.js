// this file is auto generated do not edit it
/* eslint-disable */
export const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldWorkerStakeRatioPolicy',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newWorkerStakeRatioPolicy',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'oldSchedulerRewardRatioPolicy',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newSchedulerRewardRatioPolicy',
        type: 'uint256',
      },
    ],
    name: 'PolicyUpdate',
    type: 'event',
  },
  {
    inputs: [],
    name: 'm_schedulerRewardRatioPolicy',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'm_workerStakeRatioPolicy',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'm_workerpoolDescription',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'registry',
    outputs: [
      { internalType: 'contract IRegistry', name: '', type: 'address' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: '_ens', type: 'address' },
      { internalType: 'string', name: '_name', type: 'string' },
    ],
    name: 'setName',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: '_workerpoolDescription',
        type: 'string',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_newWorkerStakeRatioPolicy',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_newSchedulerRewardRatioPolicy',
        type: 'uint256',
      },
    ],
    name: 'changePolicy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
export const networks = {};
export default { abi, networks };
