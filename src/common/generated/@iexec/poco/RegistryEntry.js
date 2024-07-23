// this file is auto generated do not edit it
/* eslint-disable */
export const abi = [
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
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
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
];
export const networks = {};
export default { abi, networks };
