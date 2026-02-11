import { resolveTeeFrameworkFromTag } from '../../../src/common/execution/order-helper.js';
import { TEE_FRAMEWORKS } from '../../../src/common/utils/constant.js';
import { encodeTag } from '../../../src/common/utils/utils.js';

describe('order-helper', () => {
  describe('resolveTeeFrameworkFromTag', () => {
    test('returns TDX for tag [tee, tdx]', async () => {
      const tag = encodeTag(['tee', 'tdx']);
      const framework = await resolveTeeFrameworkFromTag(tag);
      expect(framework).toBe(TEE_FRAMEWORKS.TDX);
    });

    test('returns TDX for tag array [tee, tdx]', async () => {
      const framework = await resolveTeeFrameworkFromTag(['tee', 'tdx']);
      expect(framework).toBe(TEE_FRAMEWORKS.TDX);
    });

    test('returns undefined for tag [tee] only (agnostic)', async () => {
      const framework = await resolveTeeFrameworkFromTag(['tee']);
      expect(framework).toBeUndefined();
    });

    test('returns SCONE for tag [tee, scone]', async () => {
      const framework = await resolveTeeFrameworkFromTag(['tee', 'scone']);
      expect(framework).toBe(TEE_FRAMEWORKS.SCONE);
    });

    test('returns GRAMINE for tag [tee, gramine]', async () => {
      const framework = await resolveTeeFrameworkFromTag(['tee', 'gramine']);
      expect(framework).toBe(TEE_FRAMEWORKS.GRAMINE);
    });
  });
});
