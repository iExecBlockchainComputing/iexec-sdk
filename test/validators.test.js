const BN = require('bn.js');
const {
  // throwIfMissing,
  // stringSchema,
  uint256Schema,
  // addressSchema,
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
      new ValidationError('this must be a number'),
    );
  });
  test('throw with negative int', async () => {
    await expect(uint256Schema().validate(-1)).rejects.toThrow(
      new ValidationError('this must be a number'),
    );
  });
  test('throw with negative string int', async () => {
    await expect(uint256Schema().validate('-1')).rejects.toThrow(
      new ValidationError('this must be a number'),
    );
  });
  test('throw with invalid string', async () => {
    await expect(uint256Schema().validate('0xfg')).rejects.toThrow(
      new ValidationError('this must be a number'),
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
    await expect(tagSchema().validate(['foo'])).rejects.toThrow(
      new ValidationError('invalid tag: unknown tag foo'),
    );
  });
  test('unknown isolated tag', async () => {
    await expect(tagSchema().validate('foo')).rejects.toThrow(
      new ValidationError('invalid tag: unknown tag foo'),
    );
  });
});
