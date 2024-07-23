// this file is auto generated do not edit it
/* eslint-disable */
export const abi = [
  {
    inputs: [
      { internalType: 'address', name: '_erc1538Delegate', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'string',
        name: 'message',
        type: 'string',
      },
    ],
    name: 'CommitMessage',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes4',
        name: 'functionId',
        type: 'bytes4',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'oldDelegate',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newDelegate',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'functionSignature',
        type: 'string',
      },
    ],
    name: 'FunctionUpdate',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  { stateMutability: 'payable', type: 'fallback', payable: true },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'newOwner', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive', payable: true },
];
export const networks = {
  1: {
    events: {
      '0xaa1c0a0a78cec2470f9652e5d29540752e7a64d70f926933cebf13afaeda45de': {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'string',
            name: 'message',
            type: 'string',
          },
        ],
        name: 'CommitMessage',
        type: 'event',
      },
      '0x3234040ce3bd4564874e44810f198910133a1b24c4e84aac87edbf6b458f5353': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'bytes4',
            name: 'functionId',
            type: 'bytes4',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'oldDelegate',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newDelegate',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'string',
            name: 'functionSignature',
            type: 'string',
          },
        ],
        name: 'FunctionUpdate',
        type: 'event',
      },
      '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'previousOwner',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
      },
    },
    links: {},
    address: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
  },
  3: {
    events: {
      '0xaa1c0a0a78cec2470f9652e5d29540752e7a64d70f926933cebf13afaeda45de': {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'string',
            name: 'message',
            type: 'string',
          },
        ],
        name: 'CommitMessage',
        type: 'event',
      },
      '0x3234040ce3bd4564874e44810f198910133a1b24c4e84aac87edbf6b458f5353': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'bytes4',
            name: 'functionId',
            type: 'bytes4',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'oldDelegate',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newDelegate',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'string',
            name: 'functionSignature',
            type: 'string',
          },
        ],
        name: 'FunctionUpdate',
        type: 'event',
      },
      '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'previousOwner',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
      },
    },
    links: {},
    address: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
  },
  4: {
    events: {
      '0xaa1c0a0a78cec2470f9652e5d29540752e7a64d70f926933cebf13afaeda45de': {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'string',
            name: 'message',
            type: 'string',
          },
        ],
        name: 'CommitMessage',
        type: 'event',
      },
      '0x3234040ce3bd4564874e44810f198910133a1b24c4e84aac87edbf6b458f5353': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'bytes4',
            name: 'functionId',
            type: 'bytes4',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'oldDelegate',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newDelegate',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'string',
            name: 'functionSignature',
            type: 'string',
          },
        ],
        name: 'FunctionUpdate',
        type: 'event',
      },
      '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'previousOwner',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
      },
    },
    links: {},
    address: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
  },
  5: {
    events: {
      '0xaa1c0a0a78cec2470f9652e5d29540752e7a64d70f926933cebf13afaeda45de': {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'string',
            name: 'message',
            type: 'string',
          },
        ],
        name: 'CommitMessage',
        type: 'event',
      },
      '0x3234040ce3bd4564874e44810f198910133a1b24c4e84aac87edbf6b458f5353': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'bytes4',
            name: 'functionId',
            type: 'bytes4',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'oldDelegate',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newDelegate',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'string',
            name: 'functionSignature',
            type: 'string',
          },
        ],
        name: 'FunctionUpdate',
        type: 'event',
      },
      '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'previousOwner',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
      },
    },
    links: {},
    address: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
  },
  42: {
    events: {
      '0xaa1c0a0a78cec2470f9652e5d29540752e7a64d70f926933cebf13afaeda45de': {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'string',
            name: 'message',
            type: 'string',
          },
        ],
        name: 'CommitMessage',
        type: 'event',
      },
      '0x3234040ce3bd4564874e44810f198910133a1b24c4e84aac87edbf6b458f5353': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'bytes4',
            name: 'functionId',
            type: 'bytes4',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'oldDelegate',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newDelegate',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'string',
            name: 'functionSignature',
            type: 'string',
          },
        ],
        name: 'FunctionUpdate',
        type: 'event',
      },
      '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'previousOwner',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
      },
    },
    links: {},
    address: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
  },
  133: {
    events: {
      '0xaa1c0a0a78cec2470f9652e5d29540752e7a64d70f926933cebf13afaeda45de': {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'string',
            name: 'message',
            type: 'string',
          },
        ],
        name: 'CommitMessage',
        type: 'event',
      },
      '0x3234040ce3bd4564874e44810f198910133a1b24c4e84aac87edbf6b458f5353': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'bytes4',
            name: 'functionId',
            type: 'bytes4',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'oldDelegate',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newDelegate',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'string',
            name: 'functionSignature',
            type: 'string',
          },
        ],
        name: 'FunctionUpdate',
        type: 'event',
      },
      '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'previousOwner',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
      },
    },
    links: {},
    address: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
  },
  134: {
    events: {
      '0xaa1c0a0a78cec2470f9652e5d29540752e7a64d70f926933cebf13afaeda45de': {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: 'string',
            name: 'message',
            type: 'string',
          },
        ],
        name: 'CommitMessage',
        type: 'event',
      },
      '0x3234040ce3bd4564874e44810f198910133a1b24c4e84aac87edbf6b458f5353': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'bytes4',
            name: 'functionId',
            type: 'bytes4',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'oldDelegate',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newDelegate',
            type: 'address',
          },
          {
            indexed: false,
            internalType: 'string',
            name: 'functionSignature',
            type: 'string',
          },
        ],
        name: 'FunctionUpdate',
        type: 'event',
      },
      '0x8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e0': {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'address',
            name: 'previousOwner',
            type: 'address',
          },
          {
            indexed: true,
            internalType: 'address',
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
      },
    },
    links: {},
    address: '0x3eca1B216A7DF1C7689aEb259fFB83ADFB894E7f',
  },
};
export default { abi, networks };
