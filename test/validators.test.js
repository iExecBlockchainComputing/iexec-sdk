const BN = require('bn.js');
const { getDefaultProvider } = require('ethers');
const {
  // throwIfMissing,
  // stringSchema,
  uint256Schema,
  addressSchema,
  // bytes32Schema,
  // apporderSchema,
  // signedApporderSchema,
  // datasetorderSchema,
  // signedDatasetorderSchema,
  // workerpoolorderSchema,
  // signedWorkerpoolorderSchema,
  // requestorderSchema,
  // signedRequestorderSchema,
  paramsSchema,
  tagSchema,
  // chainIdSchema,
  // hexnumberSchema,
  positiveIntSchema,
  positiveStrictIntSchema,
  // appSchema,
  // datasetSchema,
  // categorySchema,
  // workerpoolSchema,
  objParamsSchema,
  ValidationError,
} = require('../src/validator');

// TESTS
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

describe('[objParamsSchema]', () => {
  test('empty object', async () => {
    await expect(objParamsSchema().validate({})).rejects.toThrow(
      new ValidationError(
        'iexec_result_storage_proxy is required field with "ipfs" storage',
      ),
    );
  });

  test('empty object with resultProxyURL in context', async () => {
    await expect(
      objParamsSchema().validate(
        {},
        { context: { resultProxyURL: 'https://result-proxy.iex.ec' } },
      ),
    ).resolves.toEqual({
      iexec_result_storage_provider: 'ipfs',
      iexec_result_storage_proxy: 'https://result-proxy.iex.ec',
      iexec_tee_post_compute_fingerprint: 'abc|123|abc',
      iexec_tee_post_compute_image: 'tee-post-compute-image',
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
      iexec_tee_post_compute_fingerprint: 'abc|123|abc',
      iexec_tee_post_compute_image: 'tee-post-compute-image',
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
        'iexec_result_storage_provider "foo" is not supported for TEE tasks use one of supported storage providers (ipfs, dropbox)',
      ),
    );
  });

  test('with iexec_args', async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_args: 'test',
        },
        { context: { resultProxyURL: 'https://result-proxy.iex.ec' } },
      ),
    ).resolves.toEqual({
      iexec_args: 'test',
      iexec_result_storage_provider: 'ipfs',
      iexec_result_storage_proxy: 'https://result-proxy.iex.ec',
      iexec_tee_post_compute_fingerprint: 'abc|123|abc',
      iexec_tee_post_compute_image: 'tee-post-compute-image',
    });
  });

  test('with iexec_input_files', async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_input_files: [
            'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
            'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
          ],
        },
        { context: { resultProxyURL: 'https://result-proxy.iex.ec' } },
      ),
    ).resolves.toEqual({
      iexec_input_files: [
        'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
        'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
      ],
      iexec_result_storage_provider: 'ipfs',
      iexec_result_storage_proxy: 'https://result-proxy.iex.ec',
      iexec_tee_post_compute_fingerprint: 'abc|123|abc',
      iexec_tee_post_compute_image: 'tee-post-compute-image',
    });
  });

  test('with iexec_input_files (bad url)', async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_input_files: [
            'https://iex.ec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
            'https://iexec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf',
          ],
        },
        { context: { resultProxyURL: 'https://result-proxy.iex.ec' } },
      ),
    ).rejects.toThrow(
      new ValidationError(
        'iexec_input_files[1] https://iexec/wp-content/uploads/pdf/iExec-WPv3.0-English.pdf is not a valid URL',
      ),
    );
  });

  test('with custom tee config', async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_tee_post_compute_fingerprint: 'custom-fingerprint',
          iexec_tee_post_compute_image: 'custom-image',
        },
        { context: { resultProxyURL: 'https://result-proxy.iex.ec' } },
      ),
    ).resolves.toEqual({
      iexec_result_storage_provider: 'ipfs',
      iexec_result_storage_proxy: 'https://result-proxy.iex.ec',
      iexec_tee_post_compute_fingerprint: 'custom-fingerprint',
      iexec_tee_post_compute_image: 'custom-image',
    });
  });

  test('with custom result-proxy', async () => {
    await expect(
      objParamsSchema().validate({
        iexec_result_storage_proxy: 'https://custom-result-proxy.iex.ec',
      }),
    ).resolves.toEqual({
      iexec_result_storage_provider: 'ipfs',
      iexec_result_storage_proxy: 'https://custom-result-proxy.iex.ec',
      iexec_tee_post_compute_fingerprint: 'abc|123|abc',
      iexec_tee_post_compute_image: 'tee-post-compute-image',
    });
  });

  test('with encryption (true)', async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_result_encryption: true,
        },
        { context: { resultProxyURL: 'https://result-proxy.iex.ec' } },
      ),
    ).resolves.toEqual({
      iexec_result_encryption: true,
      iexec_result_storage_provider: 'ipfs',
      iexec_result_storage_proxy: 'https://result-proxy.iex.ec',
      iexec_tee_post_compute_fingerprint: 'abc|123|abc',
      iexec_tee_post_compute_image: 'tee-post-compute-image',
    });
  });

  test("with encryption ('true')", async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_result_encryption: 'true',
        },
        { context: { resultProxyURL: 'https://result-proxy.iex.ec' } },
      ),
    ).resolves.toEqual({
      iexec_result_encryption: true,
      iexec_result_storage_provider: 'ipfs',
      iexec_result_storage_proxy: 'https://result-proxy.iex.ec',
      iexec_tee_post_compute_fingerprint: 'abc|123|abc',
      iexec_tee_post_compute_image: 'tee-post-compute-image',
    });
  });

  test("with encryption ('foo')", async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_result_encryption: 'foo',
        },
        { context: { resultProxyURL: 'https://result-proxy.iex.ec' } },
      ),
    ).rejects.toThrow(
      new ValidationError(
        'iexec_result_encryption must be a `boolean` type, but the final value was: `"foo"`.',
      ),
    );
  });

  test('with logger (true)', async () => {
    await expect(
      objParamsSchema().validate(
        {
          iexec_developer_logger: true,
        },
        { context: { resultProxyURL: 'https://result-proxy.iex.ec' } },
      ),
    ).resolves.toEqual({
      iexec_developer_logger: true,
      iexec_result_storage_provider: 'ipfs',
      iexec_result_storage_proxy: 'https://result-proxy.iex.ec',
      iexec_tee_post_compute_fingerprint: 'abc|123|abc',
      iexec_tee_post_compute_image: 'tee-post-compute-image',
    });
  });

  test('strip enexpected key', async () => {
    await expect(
      objParamsSchema().validate(
        {
          foo: true,
        },
        { context: { resultProxyURL: 'https://result-proxy.iex.ec' } },
      ),
    ).resolves.toEqual({
      iexec_result_storage_provider: 'ipfs',
      iexec_result_storage_proxy: 'https://result-proxy.iex.ec',
      iexec_tee_post_compute_fingerprint: 'abc|123|abc',
      iexec_tee_post_compute_image: 'tee-post-compute-image',
    });
  });
});

describe('[tagSchema]', () => {
  test('bytes 32 tags', async () => {
    await expect(
      tagSchema().validate(
        '0x0000000000000000000000000000000000000000000000000000000000000101',
      ),
    ).resolves.toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000101',
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
    await expect(tagSchema().validate(['tee', 'gpu'])).resolves.toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000101',
    );
  });
  test('isolated tag', async () => {
    await expect(tagSchema().validate('gpu')).resolves.toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000100',
    );
  });
  test('comma separated tags', async () => {
    await expect(tagSchema().validate('gpu,tee')).resolves.toBe(
      '0x0000000000000000000000000000000000000000000000000000000000000101',
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
});

describe('[addressSchema]', () => {
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
      addressSchema({ ethProvider: getDefaultProvider() }).validate(
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
  test('address undefined (throw)', async () => {
    await expect(
      addressSchema({ ethProvider: getDefaultProvider() }).validate(undefined),
    ).rejects.toThrow(
      new ValidationError('undefined is not a valid ethereum address'),
    );
  });
  test('ens (resolve ENS with ethProvider)', async () => {
    await expect(
      addressSchema({ ethProvider: getDefaultProvider() }).validate(
        'rlc.iexec.eth',
      ),
    ).resolves.toBe('0x607F4C5BB672230e8672085532f7e901544a7375');
  });
  test('invalid ens (throw when ethProvider is missing)', async () => {
    await expect(
      addressSchema({ ethProvider: getDefaultProvider() }).validate(
        'pierre.iexec.eth',
      ),
    ).rejects.toThrow(
      new ValidationError('unable to resolve ENS pierre.iexec.eth'),
    );
  });
  test('ens (throw when ethProvider is missing)', async () => {
    await expect(addressSchema().validate('rlc.iexec.eth')).rejects.toThrow(
      new ValidationError('unable to resolve ENS rlc.iexec.eth'),
    );
  });
});
