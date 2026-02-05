import { stripTeeFrameworkFromTag } from '../../../src/common/utils/utils.js';

describe('utils', () => {
  describe('stripTeeFrameworkFromTag', () => {
    test('should strip TEE framework bits from tag', async () => {
      // 256 bits set to 1
      const maxTag =
        `0x` +
        BigInt(
          '0b1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111',
        ).toString(16);

      // bits 1,2,3 represent TEE frameworks disabled
      const maxTagExcludingTeeFramework =
        `0x` +
        BigInt(
          '0b1111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111110001',
        ).toString(16);

      const teeTag =
        '0x0000000000000000000000000000000000000000000000000000000000000001';
      const teeSconeTag =
        '0x0000000000000000000000000000000000000000000000000000000000000003';
      const teeGramineTag =
        '0x0000000000000000000000000000000000000000000000000000000000000005';

      expect(stripTeeFrameworkFromTag(maxTag)).toBe(
        maxTagExcludingTeeFramework,
      );
      expect(stripTeeFrameworkFromTag(teeTag)).toBe(teeTag);
      expect(stripTeeFrameworkFromTag(teeSconeTag)).toBe(teeTag);
      expect(stripTeeFrameworkFromTag(teeGramineTag)).toBe(teeTag);
    });
  });
});
