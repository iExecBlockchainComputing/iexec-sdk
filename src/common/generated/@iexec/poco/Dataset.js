// this file is auto generated do not edit it
/* eslint-disable */
export const abi = [
  {
    inputs: [],
    name: 'm_datasetChecksum',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'm_datasetMultiaddr',
    outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'm_datasetName',
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
      { internalType: 'string', name: '_datasetName', type: 'string' },
      { internalType: 'bytes', name: '_datasetMultiaddr', type: 'bytes' },
      { internalType: 'bytes32', name: '_datasetChecksum', type: 'bytes32' },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
export const networks = {};
export default { abi, networks };
