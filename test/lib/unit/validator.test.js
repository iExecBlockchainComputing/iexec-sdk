import { Buffer } from 'buffer';
import { BN } from 'bn.js';
import { getDefaultProvider } from 'ethers';
import fsExtra from 'fs-extra';
import { join } from 'path';
import {
  ALCHEMY_API_KEY,
  ETHERSCAN_API_KEY,
  INFURA_PROJECT_ID,
  TEE_FRAMEWORKS,
} from '../../test-utils.js';
import {
  uint256Schema,
  weiAmountSchema,
  nRlcAmountSchema,
  addressSchema,
  paramsSchema,
  paramsInputFilesArraySchema,
  tagSchema,
  positiveIntSchema,
  positiveStrictIntSchema,
  mrenclaveSchema,
  objParamsSchema,
  base64Encoded256bitsKeySchema,
  fileBufferSchema,
  ensDomainSchema,
  ensLabelSchema,
  textRecordKeySchema,
  textRecordValueSchema,
  workerpoolApiUrlSchema,
  smsUrlOrMapSchema,
  teeFrameworkSchema,
  addressOrAnySchema,
} from '../../../src/common/utils/validator.js';
import { errors } from '../../../src/lib/index.js';

const { ValidationError } = errors;

const { readFile } = fsExtra;

const mainnetDefaultProvider = getDefaultProvider('mainnet', {
  cloudflare: true,
  alchemy: ALCHEMY_API_KEY || '-',
  etherscan: ETHERSCAN_API_KEY || '-',
  infura: INFURA_PROJECT_ID || '-',
});

describe('[positiveIntSchema]', () => {
  test('int', async () => {
    await expect(positiveIntSchema().validate(48)).resolves.toBe(48);
  });
  test('string int', async () => {
    await expect(positiveIntSchema().validate('48')).resolves.toBe(48);
  });
  test('hex string', async () => {
    await expect(positiveIntSchema().validate('0xff')).resolves.toBe(255);
  });
  test('BN', async () => {
    await expect(positiveIntSchema().validate(new BN(123456789))).resolves.toBe(
      123456789,
    );
  });
  test('int 0', async () => {
    await expect(positiveIntSchema().validate(0)).resolves.toBe(0);
  });
  test('throw with negative int', async () => {
    await expect(positiveIntSchema().validate(-1)).rejects.toThrow(
      new ValidationError('this must be greater than or equal to 0'),
    );
  });
  test('throw with negative string int', async () => {
    await expect(positiveIntSchema().validate('-1')).rejects.toThrow(
      new ValidationError('this must be greater than or equal to 0'),
    );
  });
  test('throw with int string > MAX_SAFE_INTEGER', async () => {
    await expect(
      positiveIntSchema().validate('9007199254740992'),
    ).rejects.toThrow(
      new ValidationError(
        'this must be less than or equal to 9007199254740990',
      ),
    );
  });
  test('throw with hex string > MAX_SAFE_INTEGER', async () => {
    await expect(
      positiveIntSchema().validate('0xffffffffffffffffffff'),
    ).rejects.toThrow(
      new ValidationError(
        'this must be less than or equal to 9007199254740990',
      ),
    );
  });
  test('throw with BN > MAX_SAFE_INTEGER', async () => {
    await expect(
      positiveIntSchema().validate(new BN('9007199254740992')),
    ).rejects.toThrow(
      new ValidationError(
        'this must be less than or equal to 9007199254740990',
      ),
    );
  });
  test('throw with invalid string', async () => {
    await expect(positiveIntSchema().validate('0xfg')).rejects.toThrow(
      new ValidationError(
        'this must be a `number` type, but the final value was: `NaN` (cast from the value `"0xfg"`).',
      ),
    );
  });
});

describe('[positiveStrictIntSchema]', () => {
  test('int', async () => {
    await expect(positiveStrictIntSchema().validate(48)).resolves.toBe(48);
  });
  test('string int', async () => {
    await expect(
      positiveStrictIntSchema().validate('9007199254740990'),
    ).resolves.toBe(9007199254740990);
  });
  test('hex string', async () => {
    await expect(positiveStrictIntSchema().validate('0xff')).resolves.toBe(255);
  });
  test('BN', async () => {
    await expect(
      positiveStrictIntSchema().validate(new BN(123456789)),
    ).resolves.toBe(123456789);
  });
  test('throw with int 0', async () => {
    await expect(positiveStrictIntSchema().validate(0)).rejects.toThrow(
      new ValidationError('this must be greater than or equal to 1'),
    );
  });
  test("throw with string '0'", async () => {
    await expect(positiveStrictIntSchema().validate('0')).rejects.toThrow(
      new ValidationError('this must be greater than or equal to 1'),
    );
  });
  test('throw with hex string 0x0', async () => {
    await expect(positiveStrictIntSchema().validate('0x0')).rejects.toThrow(
      new ValidationError('this must be greater than or equal to 1'),
    );
  });
  test('throw with BN(0)', async () => {
    await expect(positiveStrictIntSchema().validate(new BN(0))).rejects.toThrow(
      new ValidationError('this must be greater than or equal to 1'),
    );
  });
  test('throw with negative int', async () => {
    await expect(positiveStrictIntSchema().validate(-1)).rejects.toThrow(
      new ValidationError('this must be greater than or equal to 1'),
    );
  });
  test('throw with negative string int', async () => {
    await expect(positiveStrictIntSchema().validate('-1')).rejects.toThrow(
      new ValidationError('this must be greater than or equal to 1'),
    );
  });
  test('throw with int string > MAX_SAFE_INTEGER', async () => {
    await expect(
      positiveStrictIntSchema().validate('9007199254740992'),
    ).rejects.toThrow(
      new ValidationError(
        'this must be less than or equal to 9007199254740990',
      ),
    );
  });
  test('throw with hex string > MAX_SAFE_INTEGER', async () => {
    await expect(
      positiveStrictIntSchema().validate('0xffffffffffffffffffff'),
    ).rejects.toThrow(
      new ValidationError(
        'this must be less than or equal to 9007199254740990',
      ),
    );
  });
  test('throw with BN > MAX_SAFE_INTEGER', async () => {
    await expect(
      positiveStrictIntSchema().validate(new BN('9007199254740992')),
    ).rejects.toThrow(
      new ValidationError(
        'this must be less than or equal to 9007199254740990',
      ),
    );
  });
  test('throw with invalid string', async () => {
    await expect(positiveStrictIntSchema().validate('0xfg')).rejects.toThrow(
      new ValidationError(
        'this must be a `number` type, but the final value was: `NaN` (cast from the value `"0xfg"`).',
      ),
    );
  });
});

describe('[uint256Schema]', () => {
  test('int', async () => {
    await expect(uint256Schema().validate(48)).resolves.toBe('48');
  });
  test('string int', async () => {
    await expect(uint256Schema().validate('9007199254740990')).resolves.toBe(
      '9007199254740990',
    );
  });
  test('BN', async () => {
    await expect(
      uint256Schema().validate(new BN('9007199254740990')),
    ).resolves.toBe('9007199254740990');
  });
  test('string int > MAX_SAFE_INTEGER', async () => {
    await expect(uint256Schema().validate('9007199254740992')).resolves.toBe(
      '9007199254740992',
    );
  });
  test('int 0', async () => {
    await expect(uint256Schema().validate(0)).resolves.toBe('0');
  });
  test('throw with hex string', async () => {
    await expect(uint256Schema().validate('0x01')).rejects.toThrow(
      new ValidationError('0x01 is not a valid uint256'),
    );
  });
  test('throw with negative int', async () => {
    await expect(uint256Schema().validate(-1)).rejects.toThrow(
      new ValidationError('-1 is not a valid uint256'),
    );
  });
  test('throw with negative string int', async () => {
    await expect(uint256Schema().validate('-1')).rejects.toThrow(
      new ValidationError('-1 is not a valid uint256'),
    );
  });
  test('throw with invalid string', async () => {
    await expect(uint256Schema().validate('0xfg')).rejects.toThrow(
      new ValidationError('0xfg is not a valid uint256'),
    );
  });
});

describe('[nRlcAmountSchema]', () => {
  test('int', async () => {
    await expect(nRlcAmountSchema().validate(48)).resolves.toBe('48');
  });
  test('string int', async () => {
    await expect(
      nRlcAmountSchema().validate('00009007199254740990'),
    ).resolves.toBe('9007199254740990');
  });
  test('defaultUnit RLC', async () => {
    await expect(
      nRlcAmountSchema({ defaultUnit: 'RLC' }).validate(48),
    ).resolves.toBe('48000000000');
  });
  test('0 unit', async () => {
    await expect(nRlcAmountSchema().validate('0 nRLC')).resolves.toBe('0');
  });
  test('specified unit', async () => {
    await expect(nRlcAmountSchema().validate('0048 RLC')).resolves.toBe(
      '48000000000',
    );
  });
  test('specified unit override defaultUnit', async () => {
    await expect(
      nRlcAmountSchema({ defaultUnit: 'RLC' }).validate('48 nRLC'),
    ).resolves.toBe('48');
  });
  test('valid decimal string', async () => {
    await expect(nRlcAmountSchema().validate('00.48 RLC')).resolves.toBe(
      '480000000',
    );
  });
  test('valid decimal number', async () => {
    await expect(
      nRlcAmountSchema({ defaultUnit: 'RLC' }).validate(0.48),
    ).resolves.toBe('480000000');
  });
  test('BN', async () => {
    await expect(
      nRlcAmountSchema().validate(new BN('9007199254740990')),
    ).resolves.toBe('9007199254740990');
  });
  test('string int > MAX_SAFE_INTEGER', async () => {
    await expect(nRlcAmountSchema().validate('9007199254740992')).resolves.toBe(
      '9007199254740992',
    );
  });
  test('int 0', async () => {
    await expect(nRlcAmountSchema().validate(0)).resolves.toBe('0');
  });
  test('[amount]', async () => {
    await expect(nRlcAmountSchema().validate([new BN(48)])).resolves.toBe('48');
  });
  test('[amount, unit]', async () => {
    await expect(
      nRlcAmountSchema().validate([new BN(48), 'RLC']),
    ).resolves.toBe('48000000000');
  });
  test('throw with invalid unit', async () => {
    await expect(() => nRlcAmountSchema().validate('48 rlc')).rejects.toThrow(
      new ValidationError('48 rlc is not a valid amount'),
    );
  });
  test('throw with invalid decimal string', async () => {
    await expect(() => nRlcAmountSchema().validate('0.48')).rejects.toThrow(
      new ValidationError('0.48 is not a valid amount'),
    );
  });
  test('throw with invalid decimal number', async () => {
    await expect(() => nRlcAmountSchema().validate(0.48)).rejects.toThrow(
      new ValidationError('0.48 is not a valid amount'),
    );
  });
  test('throw with hex string', async () => {
    await expect(() => nRlcAmountSchema().validate('0x01')).rejects.toThrow(
      new ValidationError('0x01 is not a valid amount'),
    );
  });
  test('throw with invalid array', async () => {
    await expect(() =>
      nRlcAmountSchema().validate(['1', 'RLC', 'RLC']),
    ).rejects.toThrow(new ValidationError('1 RLC RLC is not a valid amount'));
  });
  test('throw with negative int', async () => {
    await expect(nRlcAmountSchema().validate(-1)).rejects.toThrow(
      new ValidationError('-1 is not a valid amount'),
    );
  });
  test('throw with negative string int', async () => {
    await expect(nRlcAmountSchema().validate('-1')).rejects.toThrow(
      new ValidationError('-1 is not a valid amount'),
    );
  });
});

describe('[weiAmountSchema]', () => {
  test('int', async () => {
    await expect(weiAmountSchema().validate(48)).resolves.toBe('48');
  });
  test('string int', async () => {
    await expect(
      weiAmountSchema().validate('00009007199254740990'),
    ).resolves.toBe('9007199254740990');
  });
  test('defaultUnit ether', async () => {
    await expect(
      weiAmountSchema({ defaultUnit: 'ether' }).validate(48),
    ).resolves.toBe('48000000000000000000');
  });
  test('0 unit', async () => {
    await expect(weiAmountSchema().validate('0 wei')).resolves.toBe('0');
  });
  test('specified unit wei', async () => {
    await expect(weiAmountSchema().validate('0048 wei')).resolves.toBe('48');
  });
  test('specified unit kwei', async () => {
    await expect(weiAmountSchema().validate('0048 kwei')).resolves.toBe(
      '48000',
    );
  });
  test('specified unit mwei', async () => {
    await expect(weiAmountSchema().validate('0048 mwei')).resolves.toBe(
      '48000000',
    );
  });
  test('specified unit gwei', async () => {
    await expect(weiAmountSchema().validate('0048 gwei')).resolves.toBe(
      '48000000000',
    );
  });
  test('specified unit szabo', async () => {
    await expect(weiAmountSchema().validate('0048 szabo')).resolves.toBe(
      '48000000000000',
    );
  });
  test('specified unit finney', async () => {
    await expect(weiAmountSchema().validate('0048 finney')).resolves.toBe(
      '48000000000000000',
    );
  });
  test('specified unit ether', async () => {
    await expect(weiAmountSchema().validate('0048 ether')).resolves.toBe(
      '48000000000000000000',
    );
  });
  test('specified unit eth', async () => {
    await expect(weiAmountSchema().validate('0048 eth')).resolves.toBe(
      '48000000000000000000',
    );
  });
  test('specified unit override defaultUnit', async () => {
    await expect(
      weiAmountSchema({ defaultUnit: 'ethers' }).validate('48 wei'),
    ).resolves.toBe('48');
  });
  test('valid decimal string', async () => {
    await expect(weiAmountSchema().validate('00.48 ether')).resolves.toBe(
      '480000000000000000',
    );
  });
  test('valid decimal number', async () => {
    await expect(
      weiAmountSchema({ defaultUnit: 'ether' }).validate(0.48),
    ).resolves.toBe('480000000000000000');
  });
  test('BN', async () => {
    await expect(
      weiAmountSchema().validate(new BN('9007199254740990')),
    ).resolves.toBe('9007199254740990');
  });
  test('string int > MAX_SAFE_INTEGER', async () => {
    await expect(weiAmountSchema().validate('9007199254740992')).resolves.toBe(
      '9007199254740992',
    );
  });
  test('int 0', async () => {
    await expect(weiAmountSchema().validate(0)).resolves.toBe('0');
  });
  test('[amount]', async () => {
    await expect(weiAmountSchema().validate([new BN(48)])).resolves.toBe('48');
  });
  test('[amount, unit]', async () => {
    await expect(
      weiAmountSchema().validate([new BN(48), 'gwei']),
    ).resolves.toBe('48000000000');
  });
  test('throw with invalid unit', async () => {
    await expect(() =>
      weiAmountSchema().validate('48 ethereum'),
    ).rejects.toThrow(new ValidationError('48 ethereum is not a valid amount'));
  });
  test('throw with invalid decimal string', async () => {
    await expect(() => weiAmountSchema().validate('0.48')).rejects.toThrow(
      new ValidationError('0.48 is not a valid amount'),
    );
  });
  test('throw with invalid decimal number', async () => {
    await expect(() => weiAmountSchema().validate(0.48)).rejects.toThrow(
      new ValidationError('0.48 is not a valid amount'),
    );
  });
  test('throw with hex string', async () => {
    await expect(() => weiAmountSchema().validate('0x01')).rejects.toThrow(
      new ValidationError('0x01 is not a valid amount'),
    );
  });
  test('throw with invalid array', async () => {
    await expect(() =>
      weiAmountSchema().validate(['1', 'eth', 'eth']),
    ).rejects.toThrow(new ValidationError('1 eth eth is not a valid amount'));
  });
  test('throw with negative int', async () => {
    await expect(weiAmountSchema().validate(-1)).rejects.toThrow(
      new ValidationError('-1 is not a valid amount'),
    );
  });
  test('throw with negative string int', async () => {
    await expect(weiAmountSchema().validate('-1')).rejects.toThrow(
      new ValidationError('-1 is not a valid amount'),
    );
  });
});

describe('[paramsSchema]', () => {
  test('object', async () => {
    await expect(
      paramsSchema().validate({
        iexec_args: 'test',
        iexec_input_files: [
          'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
          'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
        ],
      }),
    ).resolves.toBe(
      '{"iexec_args":"test","iexec_input_files":["https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf","https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf"]}',
    );
  });
  test('string', async () => {
    await expect(
      paramsSchema().validate(
        '{"iexec_args":"test","iexec_input_files":["https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf","https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf"]}',
      ),
    ).resolves.toBe(
      '{"iexec_args":"test","iexec_input_files":["https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf","https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf"]}',
    );
  });
  test('number', async () => {
    await expect(paramsSchema().validate(42)).resolves.toBe('42');
  });
});

describe('[paramsInputFilesArraySchema]', () => {
  test('array of URL', async () => {
    await expect(
      paramsInputFilesArraySchema().validate([
        'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
        'http://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
        'http://docker-service:8080/uploads/pdf/iExec-WPv3.0-English.pdf',
      ]),
    ).resolves.toEqual([
      'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
      'http://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
      'http://docker-service:8080/uploads/pdf/iExec-WPv3.0-English.pdf',
    ]);
  });
  test('string comma separated list of URL', async () => {
    await expect(
      paramsInputFilesArraySchema().validate(
        'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf,https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
      ),
    ).resolves.toEqual([
      'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
      'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
    ]);
  });
  test('empty string', async () => {
    await expect(paramsInputFilesArraySchema().validate('')).rejects.toThrow(
      new ValidationError('[0] "" is not a valid URL'),
    );
  });
  test('string invalid URL', async () => {
    await expect(
      paramsInputFilesArraySchema().validate('example.com/foo.txt'),
    ).rejects.toThrow(
      new ValidationError('[0] "example.com/foo.txt" is not a valid URL'),
    );
  });
  test('empty array', async () => {
    await expect(paramsInputFilesArraySchema().validate([])).resolves.toEqual(
      [],
    );
  });
  test('undefined', async () => {
    await expect(
      paramsInputFilesArraySchema().validate(undefined),
    ).resolves.toEqual(undefined);
  });
});

describe('[objParamsSchema]', () => {
  test('empty object', async () => {
    await expect(objParamsSchema().validate({})).resolves.toEqual({
      iexec_result_storage_provider: 'ipfs',
    });
  });

  test('dropbox not supported for non-tee', async () => {
    await expect(
      objParamsSchema().validate({ iexec_result_storage_provider: 'dropbox' }),
    ).rejects.toThrow(
      new ValidationError(
        'iexec_result_storage_provider "dropbox" is not supported for non TEE tasks use supported storage provider ipfs',
      ),
    );
  });

  test('dropbox supported with isTee context', async () => {
    await expect(
      objParamsSchema().validate(
        { iexec_result_storage_provider: 'dropbox' },
        { context: { isTee: true } },
      ),
    ).resolves.toEqual({
      iexec_result_storage_provider: 'dropbox',
    });
  });

  test('unsupported provider with isTee context', async () => {
    await expect(
      objParamsSchema().validate(
        { iexec_result_storage_provider: 'foo' },
        { context: { isTee: true } },
      ),
    ).rejects.toThrow(
      new ValidationError(
        'iexec_result_storage_provider "foo" is not a valid storage provider, use one of the supported providers (ipfs, dropbox)',
      ),
    );
  });

  test('iexec_secrets is not supported outside of TEE context', async () => {
    await expect(
      objParamsSchema().validate({
        iexec_secrets: {},
      }),
    ).rejects.toThrow(
      new ValidationError('iexec_secrets is not supported for non TEE tasks'),
    );
  });

  test('iexec_secrets is supported in TEE context', async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_secrets: { 1: 'foo' },
        },
        { context: { isTee: true } },
      ),
    ).resolves.toEqual({
      iexec_secrets: { 1: 'foo' },
      iexec_result_storage_provider: 'ipfs',
    });
  });

  test('iexec_secrets can not be null', async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_secrets: null,
        },
        { context: { isTee: true } },
      ),
    ).rejects.toThrow(new ValidationError('iexec_secrets cannot be null'));
  });

  test('iexec_secrets mapping keys must be strictly positive integers', async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_secrets: { '-1': 'foo' },
        },
        { context: { isTee: true } },
      ),
    ).rejects.toThrow(
      new ValidationError(
        'iexec_secrets mapping keys must be strictly positive integers',
      ),
    );
    await expect(
      objParamsSchema().validate(
        {
          iexec_secrets: { 0: 'foo' },
        },
        { context: { isTee: true } },
      ),
    ).rejects.toThrow(
      new ValidationError(
        'iexec_secrets mapping keys must be strictly positive integers',
      ),
    );
    await expect(
      objParamsSchema().validate(
        {
          iexec_secrets: { foo: 'foo' },
        },
        { context: { isTee: true } },
      ),
    ).rejects.toThrow(
      new ValidationError(
        'iexec_secrets mapping keys must be strictly positive integers',
      ),
    );
  });

  test('iexec_secrets mapping names must be strings', async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_secrets: { 1: { foo: 'bar' } },
        },
        { context: { isTee: true } },
      ),
    ).rejects.toThrow(
      new ValidationError('iexec_secrets mapping names must be strings'),
    );
    await expect(
      objParamsSchema().validate(
        {
          iexec_secrets: { 1: 1 },
        },
        { context: { isTee: true } },
      ),
    ).rejects.toThrow(
      new ValidationError('iexec_secrets mapping names must be strings'),
    );
  });

  test('with iexec_args', async () => {
    await expect(
      objParamsSchema().validate({
        iexec_args: 'test',
      }),
    ).resolves.toEqual({
      iexec_args: 'test',
      iexec_result_storage_provider: 'ipfs',
    });
  });

  test('with iexec_input_files', async () => {
    await expect(
      objParamsSchema().validate({
        iexec_input_files: [
          'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
          'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
        ],
      }),
    ).resolves.toEqual({
      iexec_input_files: [
        'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
        'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
      ],
      iexec_result_storage_provider: 'ipfs',
    });
  });

  test('with iexec_input_files (bad url)', async () => {
    await expect(
      objParamsSchema().validate({
        iexec_input_files: [
          'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
          'iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
        ],
      }),
    ).rejects.toThrow(
      new ValidationError(
        'iexec_input_files[1] "iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf" is not a valid URL',
      ),
    );
  });

  test('with custom result-proxy', async () => {
    await expect(
      objParamsSchema().validate({
        iexec_result_storage_proxy: 'https://custom-result-proxy.iex.ec',
      }),
    ).resolves.toEqual({
      iexec_result_storage_provider: 'ipfs',
      iexec_result_storage_proxy: 'https://custom-result-proxy.iex.ec',
    });
  });

  test('with encryption (true)', async () => {
    await expect(
      objParamsSchema().validate({
        iexec_result_encryption: true,
      }),
    ).resolves.toEqual({
      iexec_result_encryption: true,
      iexec_result_storage_provider: 'ipfs',
    });
  });

  test("with encryption ('true')", async () => {
    await expect(
      objParamsSchema().validate({
        iexec_result_encryption: 'true',
      }),
    ).resolves.toEqual({
      iexec_result_encryption: true,
      iexec_result_storage_provider: 'ipfs',
    });
  });

  test("with encryption ('foo')", async () => {
    await expect(
      objParamsSchema().validate({
        iexec_result_encryption: 'foo',
      }),
    ).rejects.toThrow(
      new ValidationError(
        'iexec_result_encryption must be a `boolean` type, but the final value was: `"foo"`.',
      ),
    );
  });

  test('with isCallback in context, do not populate storage', async () => {
    await expect(
      objParamsSchema().validate({}, { context: { isCallback: true } }),
    ).resolves.toEqual({});
  });

  test('strip unexpected key', async () => {
    await expect(
      objParamsSchema().validate({
        foo: true,
        iexec_tee_post_compute_fingerprint: 'custom-fingerprint', // removed in in v6
        iexec_tee_post_compute_image: 'custom-image', // removed in in v6
        iexec_developer_logger: true, // removed in v8
      }),
    ).resolves.toEqual({
      iexec_result_storage_provider: 'ipfs',
    });
  });
});

describe('[tagSchema]', () => {
  test('bytes 32 tags', async () => {
    await expect(
      tagSchema().validate(
        '0x0000000000000000000000000000000000000000000000000000000000000103',
      ),
    ).resolves.toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000103',
    );
  });
  test('unknown bytes 32 tag is allowed', async () => {
    await expect(
      tagSchema().validate(
        '0x1000000000000000000000000000000000000000000000000000000000000000',
      ),
    ).resolves.toBe(
      '0x1000000000000000000000000000000000000000000000000000000000000000',
    );
  });
  test('array of tags', async () => {
    await expect(tagSchema().validate(['tee', 'scone', 'gpu'])).resolves.toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000103',
    );
  });
  test('empty tag', async () => {
    await expect(tagSchema().validate('')).resolves.toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    );
  });
  test('isolated tag', async () => {
    await expect(tagSchema().validate('gpu')).resolves.toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000100',
    );
  });
  test('comma separated tags', async () => {
    await expect(tagSchema().validate('gpu,tee,scone')).resolves.toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000103',
    );
  });
  test('unknown tag in array', async () => {
    await expect(tagSchema().validate(['tee', 'foo'])).rejects.toThrow(
      new ValidationError('tee,foo is not a valid tag. Unknown tag foo'),
    );
  });
  test('unknown isolated tag', async () => {
    await expect(tagSchema().validate('foo')).rejects.toThrow(
      new ValidationError('foo is not a valid tag. Unknown tag foo'),
    );
  });
  test('invalid tee tag', async () => {
    await expect(tagSchema().validate('tee')).rejects.toThrow(
      new ValidationError(
        "'tee' tag must be used with a tee framework ('scone'|'gramine')",
      ),
    );
    await expect(
      tagSchema().validate(
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      ),
    ).rejects.toThrow(
      new ValidationError(
        "'tee' tag must be used with a tee framework ('scone'|'gramine')",
      ),
    );
    await expect(tagSchema().validate('scone')).rejects.toThrow(
      new ValidationError("'scone' tag must be used with 'tee' tag"),
    );
    await expect(
      tagSchema().validate(
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      ),
    ).rejects.toThrow(
      new ValidationError("'scone' tag must be used with 'tee' tag"),
    );
    await expect(tagSchema().validate('gramine')).rejects.toThrow(
      new ValidationError("'gramine' tag must be used with 'tee' tag"),
    );
    await expect(
      tagSchema().validate(
        '0x0000000000000000000000000000000000000000000000000000000000000004',
      ),
    ).rejects.toThrow(
      new ValidationError("'gramine' tag must be used with 'tee' tag"),
    );
    const agnosticTeeTag = await tagSchema({ allowAgnosticTee: true }).validate(
      ['tee'],
    );
    expect(agnosticTeeTag).toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000001',
    );
    await expect(tagSchema().validate('tee,gramine,scone')).rejects.toThrow(
      new ValidationError(
        "tee framework tags are exclusive ('scone'|'gramine')",
      ),
    );
    await expect(
      tagSchema().validate(
        '0x0000000000000000000000000000000000000000000000000000000000000007',
      ),
    ).rejects.toThrow(
      new ValidationError(
        "tee framework tags are exclusive ('scone'|'gramine')",
      ),
    );
  });
});

describe('[addressSchema]', () => {
  test('undefined', async () => {
    await expect(
      addressSchema({
        ethProvider: mainnetDefaultProvider,
      }).validate(undefined),
    ).resolves.toBe(undefined);
  });
  test('address', async () => {
    await expect(
      addressSchema().validate('0x607F4C5BB672230e8672085532f7e901544a7375'),
    ).resolves.toBe('0x607F4C5BB672230e8672085532f7e901544a7375');
  });
  test('address 0x stripped', async () => {
    await expect(
      addressSchema().validate('607F4C5BB672230e8672085532f7e901544a7375'),
    ).resolves.toBe('0x607F4C5BB672230e8672085532f7e901544a7375');
  });
  test('address (with ethProvider)', async () => {
    await expect(
      addressSchema({ ethProvider: mainnetDefaultProvider }).validate(
        '0x607F4C5BB672230e8672085532f7e901544a7375',
      ),
    ).resolves.toBe('0x607F4C5BB672230e8672085532f7e901544a7375');
  });
  test('invalid address', async () => {
    await expect(
      addressSchema().validate('0x07F4C5BB672230e8672085532f7e901544a7375'),
    ).rejects.toThrow(
      new ValidationError(
        '0x07F4C5BB672230e8672085532f7e901544a7375 is not a valid ethereum address',
      ),
    );
  });
  test('ens (resolve ENS with ethProvider)', async () => {
    await expect(
      addressSchema({ ethProvider: mainnetDefaultProvider }).validate(
        'rlc.iexec.eth',
      ),
    ).resolves.toBe('0x607F4C5BB672230e8672085532f7e901544a7375');
  }, 10000);
  test('invalid ens (throw when ens is missing)', async () => {
    await expect(
      addressSchema({ ethProvider: mainnetDefaultProvider }).validate(
        'pierre.iexec.eth',
      ),
    ).rejects.toThrow(
      new ValidationError('Unable to resolve ENS pierre.iexec.eth'),
    );
  });
  test('ens (throw when ethProvider is missing)', async () => {
    await expect(addressSchema().validate('rlc.iexec.eth')).rejects.toThrow(
      new ValidationError('Unable to resolve ENS rlc.iexec.eth'),
    );
  });
});

describe('[addressOrAnySchema]', () => {
  test('undefined', async () => {
    await expect(
      addressOrAnySchema({
        ethProvider: mainnetDefaultProvider,
      }).validate(undefined),
    ).resolves.toBe(undefined);
  });
  test('any', async () => {
    await expect(addressOrAnySchema().validate('any')).resolves.toBe('any');
  });
  test('address', async () => {
    await expect(
      addressOrAnySchema().validate(
        '0x607F4C5BB672230e8672085532f7e901544a7375',
      ),
    ).resolves.toBe('0x607F4C5BB672230e8672085532f7e901544a7375');
  });
  test('address 0x stripped', async () => {
    await expect(
      addressOrAnySchema().validate('607F4C5BB672230e8672085532f7e901544a7375'),
    ).resolves.toBe('0x607F4C5BB672230e8672085532f7e901544a7375');
  });
  test('address (with ethProvider)', async () => {
    await expect(
      addressOrAnySchema({
        ethProvider: mainnetDefaultProvider,
      }).validate('0x607F4C5BB672230e8672085532f7e901544a7375'),
    ).resolves.toBe('0x607F4C5BB672230e8672085532f7e901544a7375');
  });
  test('invalid address', async () => {
    await expect(
      addressOrAnySchema().validate(
        '0x07F4C5BB672230e8672085532f7e901544a7375',
      ),
    ).rejects.toThrow(
      new ValidationError(
        '0x07F4C5BB672230e8672085532f7e901544a7375 is not a valid ethereum address',
      ),
    );
  });
  test('ens (resolve ENS with ethProvider)', async () => {
    await expect(
      addressOrAnySchema({
        ethProvider: mainnetDefaultProvider,
      }).validate('rlc.iexec.eth'),
    ).resolves.toBe('0x607F4C5BB672230e8672085532f7e901544a7375');
  }, 10000);
  test('invalid ens (throw when ens is missing)', async () => {
    await expect(
      addressOrAnySchema({
        ethProvider: mainnetDefaultProvider,
      }).validate('pierre.iexec.eth'),
    ).rejects.toThrow(
      new ValidationError('Unable to resolve ENS pierre.iexec.eth'),
    );
  });
  test('ens (throw when ethProvider is missing)', async () => {
    await expect(
      addressOrAnySchema().validate('rlc.iexec.eth'),
    ).rejects.toThrow(
      new ValidationError('Unable to resolve ENS rlc.iexec.eth'),
    );
  });
});

describe('[base64Encoded256bitsKeySchema]', () => {
  test('valid key', async () => {
    await expect(
      base64Encoded256bitsKeySchema().validate(
        'm7/kaM4WMTxHNPNAhaTAdC+8VJv8UdcsxPYpc94jls0=',
      ),
    ).resolves.toBe('m7/kaM4WMTxHNPNAhaTAdC+8VJv8UdcsxPYpc94jls0=');
  });
  test('invalid base64', async () => {
    await expect(
      base64Encoded256bitsKeySchema().validate(
        'b165f893c76df0bdde4a85ff2b6cb33e6f12babbeb612708374ff71ed516ce94',
      ),
    ).rejects.toThrow(
      'b165f893c76df0bdde4a85ff2b6cb33e6f12babbeb612708374ff71ed516ce94 is not a valid encryption key (must be base64 encoded 256 bits key)',
    );
  });
  test('invalid key length', async () => {
    await expect(
      base64Encoded256bitsKeySchema().validate('UtmonCp7SKOWuOPpXyikHQ=='),
    ).rejects.toThrow(
      'UtmonCp7SKOWuOPpXyikHQ== is not a valid encryption key (must be base64 encoded 256 bits key)',
    );
  });
  test('buffer is not valid', async () => {
    await expect(
      base64Encoded256bitsKeySchema().validate(
        Buffer.from('m7/kaM4WMTxHNPNAhaTAdC+8VJv8UdcsxPYpc94jls0=', 'base64'),
      ),
    ).rejects.toThrow();
  });
});

describe('[fileBufferSchema]', () => {
  test('file', async () => {
    const fileBuffer = await readFile(
      join(process.cwd(), 'test/inputs/files/text.zip'),
    );
    await expect(
      fileBufferSchema().validate(fileBuffer),
    ).resolves.toBeInstanceOf(Buffer);
  });
  test('text', async () => {
    await expect(fileBufferSchema().validate('foo')).rejects.toThrow(
      'Invalid file buffer, must be ArrayBuffer or Buffer',
    );
  });
  test('number', async () => {
    await expect(fileBufferSchema().validate(42)).rejects.toThrow(
      'Invalid file buffer, must be ArrayBuffer or Buffer',
    );
  });
});

describe('[mrenclaveSchema]', () => {
  test('valid obj', async () => {
    const obj = {
      framework: 'GRAMINE',
      version: 'v5',
      fingerprint:
        '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
    };
    await expect(mrenclaveSchema().validate(obj)).resolves.toEqual(
      Buffer.from(JSON.stringify(obj), 'utf8'),
    );
  });
  test('valid SCONE obj', async () => {
    const obj = {
      framework: 'SCONE',
      version: 'v5',
      entrypoint: '/app/helloworld',
      heapSize: 1073741824,
      fingerprint:
        '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
    };
    await expect(mrenclaveSchema().validate(obj)).resolves.toEqual(
      Buffer.from(JSON.stringify(obj), 'utf8'),
    );
  });
  test('valid string', async () => {
    const str = JSON.stringify({
      framework: 'SCONE',
      version: 'v5',
      entrypoint: '/app/helloworld',
      heapSize: 1073741824,
      fingerprint:
        '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
    });
    await expect(mrenclaveSchema().validate(str)).resolves.toEqual(
      Buffer.from(str, 'utf8'),
    );
  });
  test('valid bytes', async () => {
    const bytes = Buffer.from(
      JSON.stringify({
        framework: 'SCONE',
        version: 'v5',
        entrypoint: '/app/helloworld',
        heapSize: 1073741824,
        fingerprint:
          '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
      }),
      'utf8',
    );
    await expect(mrenclaveSchema().validate(bytes)).resolves.toEqual(bytes);
  });
  test('allow empty string', async () => {
    await expect(mrenclaveSchema().validate('')).resolves.toEqual(
      Buffer.from([]),
    );
  });
  test('allow undefined', async () => {
    await expect(mrenclaveSchema().validate(undefined)).resolves.toEqual(
      Buffer.from([]),
    );
    await expect(
      mrenclaveSchema().required().validate(undefined),
    ).resolves.toEqual(Buffer.from([]));
  });
  test('allow empty bytes', async () => {
    await expect(mrenclaveSchema().validate(Buffer.from([]))).resolves.toEqual(
      Buffer.from([]),
    );
  });
  test('throw when "entrypoint" is set for non SCONE framework', async () => {
    const obj = {
      framework: 'GRAMINE',
      version: 'v5',
      entrypoint: '/app/helloworld',
      fingerprint:
        '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
    };
    await expect(mrenclaveSchema().validate(obj)).rejects.toThrow(
      new ValidationError('Unknown key "entrypoint" in mrenclave'),
    );
  });
  test('throw when "heapSize" is set for non SCONE framework', async () => {
    const obj = {
      framework: 'GRAMINE',
      version: 'v5',
      heapSize: 1073741824,
      fingerprint:
        '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
    };
    await expect(mrenclaveSchema().validate(obj)).rejects.toThrow(
      new ValidationError('Unknown key "heapSize" in mrenclave'),
    );
  });
  test('throw with null', async () => {
    await expect(mrenclaveSchema().validate(null)).rejects.toThrow(
      new ValidationError('this is not a valid mrenclave'),
    );
  });
  test('throw with number', async () => {
    await expect(mrenclaveSchema().validate(42)).rejects.toThrow(
      new ValidationError('this is not a valid mrenclave'),
    );
  });
  test('throw with boolean', async () => {
    await expect(mrenclaveSchema().validate(false)).rejects.toThrow(
      new ValidationError('this is not a valid mrenclave'),
    );
  });
  test('throw when unexpected key is found in obj', async () => {
    const obj = {
      framework: 'SCONE',
      version: 'v5',
      entrypoint: '/app/helloworld',
      heapSize: 1073741824,
      fingerprint:
        '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
      foo: 'bar',
    };
    await expect(mrenclaveSchema().validate(obj)).rejects.toThrow(
      new ValidationError('Unknown key "foo" in mrenclave'),
    );
  });
  test('throw when unexpected key is found in JSON string', async () => {
    const str = JSON.stringify({
      framework: 'SCONE',
      version: 'v5',
      entrypoint: '/app/helloworld',
      heapSize: 1073741824,
      fingerprint:
        '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
      foo: 'bar',
    });
    await expect(mrenclaveSchema().validate(str)).rejects.toThrow(
      new ValidationError('Unknown key "foo" in mrenclave'),
    );
  });
  test('throw when unexpected key is found in decoded bytes', async () => {
    const bytes = Buffer.from(
      JSON.stringify({
        framework: 'SCONE',
        version: 'v5',
        entrypoint: '/app/helloworld',
        heapSize: 1073741824,
        fingerprint:
          '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
        foo: 'bar',
      }),
      'utf8',
    );
    await expect(mrenclaveSchema().validate(bytes)).rejects.toThrow(
      new ValidationError('Unknown key "foo" in mrenclave'),
    );
  });
  test('throw when a key is missing in obj', async () => {
    const obj = {
      version: 'v5',
      entrypoint: '/app/helloworld',
      heapSize: 1073741824,
      fingerprint:
        '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
    };
    await expect(mrenclaveSchema().validate(obj)).rejects.toThrow(
      new ValidationError('framework is a required field'),
    );
  });
  test('throw when a key is missing in JSON string', async () => {
    const str = JSON.stringify({
      framework: 'SCONE',
      entrypoint: '/app/helloworld',
      heapSize: 1073741824,
      fingerprint:
        '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
    });
    await expect(mrenclaveSchema().validate(str)).rejects.toThrow(
      new ValidationError('version is a required field'),
    );
  });
  test('throw when a key is missing in decoded bytes', async () => {
    const bytes = Buffer.from(
      JSON.stringify({
        framework: 'SCONE',
        version: 'v5',
        heapSize: 1073741824,
        fingerprint:
          '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
      }),
      'utf8',
    );
    await expect(mrenclaveSchema().validate(bytes)).rejects.toThrow(
      new ValidationError('entrypoint is a required field'),
    );
  });
  test('throw when framework is not a valid TEE framework', async () => {
    const obj = {
      framework: 'FOO',
      version: 'v5',
      entrypoint: '/app/helloworld',
      heapSize: 1073741824,
      fingerprint:
        '5036854f3f108465726a1374430ad0963b72a27a0e83dfea2ca11dae4cdbdf7d',
    };
    await expect(mrenclaveSchema().validate(obj)).rejects.toThrow(
      new ValidationError('framework is not a valid TEE framework'),
    );
  });
});

describe('[ensLabelSchema]', () => {
  test('valid', async () => {
    await expect(ensLabelSchema().validate('a')).resolves.toBe('a');
    await expect(ensLabelSchema().validate('🦄')).resolves.toBe('🦄');
    await expect(ensLabelSchema().validate('a-b')).resolves.toBe('a-b');
  });
  test('throw with uppercase', async () => {
    await expect(ensLabelSchema().validate('A')).rejects.toThrow(
      'A is not a valid ENS label (label cannot contain uppercase characters)',
    );
  });
  test('throw with unsupported characters', async () => {
    await expect(ensLabelSchema().validate('&')).rejects.toThrow(
      '& is not a valid ENS label (label cannot contain unsupported characters)',
    );
    await expect(ensLabelSchema().validate('@')).rejects.toThrow(
      '@ is not a valid ENS label (label cannot contain unsupported characters)',
    );
  });
  test('throw with dot', async () => {
    await expect(ensLabelSchema().validate('foo.bar')).rejects.toThrow(
      'foo.bar is not a valid ENS label (label cannot have `.`)',
    );
  });
});

describe('[ensDomainSchema]', () => {
  test('valid', async () => {
    await expect(ensDomainSchema().validate('foo.a-b.bar.eth')).resolves.toBe(
      'foo.a-b.bar.eth',
    );
    await expect(
      ensDomainSchema().validate('foo.🦄🦄🦄.bar.eth'),
    ).resolves.toBe('foo.🦄🦄🦄.bar.eth');
  });
  test('throw with uppercase', async () => {
    await expect(ensDomainSchema().validate('foo.Abc.bar.eth')).rejects.toThrow(
      'foo.Abc.bar.eth is not a valid ENS domain (domain cannot contain uppercase characters)',
    );
  });
  test('throw with unsupported characters', async () => {
    await expect(ensDomainSchema().validate('foo.a&b.bar.eth')).rejects.toThrow(
      'foo.a&b.bar.eth is not a valid ENS domain (domain cannot contain unsupported characters)',
    );
    await expect(ensDomainSchema().validate('foo.a@a.bar.eth')).rejects.toThrow(
      'foo.a@a.bar.eth is not a valid ENS domain (domain cannot contain unsupported characters)',
    );
  });
  test('throw with empty labels', async () => {
    await expect(ensDomainSchema().validate('foo..bar.eth')).rejects.toThrow(
      'foo..bar.eth is not a valid ENS domain (domain cannot have empty labels)',
    );
  });
});

describe('[textRecordKeySchema]', () => {
  test('" "', async () => {
    const res = await textRecordKeySchema().validate(' ');
    expect(res).toBe(' ');
  });
  test('throw with empty string', async () => {
    await expect(textRecordKeySchema().validate('')).rejects.toThrow(
      'this is a required field',
    );
  });
  test('throw with string coercible value', async () => {
    await expect(textRecordKeySchema().validate(1)).rejects.toThrow(
      'this must be a `string` type, but the final value was: `1`.',
    );
  });
});

describe('[textRecordValueSchema]', () => {
  test('" "', async () => {
    const res = await textRecordValueSchema().validate(' ');
    expect(res).toBe(' ');
  });
  test('allow undefined', async () => {
    const res = await textRecordValueSchema().validate();
    expect(res).toBe(undefined);
  });
  test('allow empty string', async () => {
    const res = await textRecordValueSchema().validate('');
    expect(res).toBe('');
  });
  test('throw with null', async () => {
    await expect(textRecordValueSchema().validate(null)).rejects.toThrow(
      'this cannot be null',
    );
  });
  test('throw with string coercible value', async () => {
    await expect(textRecordValueSchema().validate(1)).rejects.toThrow(
      'this must be a `string` type, but the final value was: `1`.',
    );
  });
});

describe('[workerpoolApiUrlSchema]', () => {
  test('allow IP with port', async () => {
    const res = await workerpoolApiUrlSchema().validate(
      'http://192.168.0.1:8080',
    );
    expect(res).toBe('http://192.168.0.1:8080');
  });
  test('allow url', async () => {
    const res = await workerpoolApiUrlSchema().validate(
      'https://my-workerpool.com',
    );
    expect(res).toBe('https://my-workerpool.com');
  });
  test('allow undefined', async () => {
    const res = await workerpoolApiUrlSchema().validate();
    expect(res).toBe('');
  });
  test('allow empty string', async () => {
    const res = await workerpoolApiUrlSchema().validate('');
    expect(res).toBe('');
  });
  test('throw with null', async () => {
    await expect(workerpoolApiUrlSchema().validate(null)).rejects.toThrow(
      'this cannot be null',
    );
  });
});

describe('[smsUrlOrMapSchema]', () => {
  test('allow IP with port', async () => {
    const res = await smsUrlOrMapSchema().validate('http://192.168.0.1:8080');
    expect(res).toBe('http://192.168.0.1:8080');
  });
  test('allow url', async () => {
    const res = await smsUrlOrMapSchema().validate('https://my-sms.com');
    expect(res).toBe('https://my-sms.com');
  });
  test('allow docker url', async () => {
    const res = await smsUrlOrMapSchema().validate('http://my-sms');
    expect(res).toBe('http://my-sms');
  });
  test('allow undefined', async () => {
    const res = await smsUrlOrMapSchema().validate();
    expect(res).toBe(undefined);
  });
  test('allow Record<TeeFramework,Url>', async () => {
    const smsMap = {
      scone: 'http://scone-sms',
      gramine: 'http://gramine-sms',
    };
    const res = await smsUrlOrMapSchema().validate(smsMap);
    expect(res).toEqual(smsMap);
  });
  test('allow partial Record<TeeFramework,Url>', async () => {
    const smsMap = {
      gramine: 'http://gramine-sms',
    };
    const res = await smsUrlOrMapSchema().validate(smsMap);
    expect(res).toEqual(smsMap);
  });
  test('throw with empty string', async () => {
    await expect(smsUrlOrMapSchema().validate('')).rejects.toThrow(
      'this "" is not a valid URL',
    );
  });
  test('throw with null', async () => {
    await expect(smsUrlOrMapSchema().validate(null)).rejects.toThrow(
      'this cannot be null',
    );
  });
  test('throw with invalid url', async () => {
    await expect(smsUrlOrMapSchema().validate('foo')).rejects.toThrow(
      'this "foo" is not a valid URL',
    );
  });
  test('throw with unknown TEE framework key', async () => {
    await expect(
      smsUrlOrMapSchema().validate({ foo: 'https://my-sms.com' }),
    ).rejects.toThrow('this field has unspecified keys: foo');
  });
  test('throw with invalid url on a TEE framework key', async () => {
    await expect(
      smsUrlOrMapSchema().validate({ scone: 'foo' }),
    ).rejects.toThrow('scone "foo" is not a valid URL');
  });
});

describe('[teeFrameworkSchema]', () => {
  test('allow known TEE frameworks', async () => {
    await Promise.all(
      Object.values(TEE_FRAMEWORKS).map(async (name) => {
        await expect(teeFrameworkSchema().validate(name)).resolves.toBe(name);
        await expect(
          teeFrameworkSchema().validate(name.toUpperCase()),
        ).resolves.toBe(name);
      }),
    );
  });
  test('allow undefined', async () => {
    await expect(teeFrameworkSchema().validate()).resolves.toBe(undefined);
  });
  test('throw with unknown TEE framework', async () => {
    await expect(teeFrameworkSchema().validate('foo')).rejects.toThrow(
      'this is not a valid TEE framework',
    );
  });
  test('throw with empty string', async () => {
    await expect(teeFrameworkSchema().validate('')).rejects.toThrow(
      'this is not a valid TEE framework',
    );
  });
});
