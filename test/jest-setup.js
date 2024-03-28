// @jest/global comes with jest
// eslint-disable-next-line import/no-extraneous-dependencies
import { jest, expect } from '@jest/globals';
import { getAddress } from 'ethers';

jest.setTimeout(120000);

// compare object with nested number or string number
expect.extend({
  toLooseEqual(received, target) {
    const stringifyNestedNumbers = (obj) => {
      const objOut = {};
      Object.entries(obj).forEach((e) => {
        const [k, v] = e;
        if (typeof v === 'number') objOut[k] = v.toString();
        else if (typeof v === 'object') {
          objOut[k] = stringifyNestedNumbers(v);
        } else objOut[k] = v;
      });
      return objOut;
    };
    return {
      pass: this.equals(
        stringifyNestedNumbers(received),
        stringifyNestedNumbers(target),
      ),
      message: () =>
        `not loosely equal \nreceived: ${JSON.stringify(
          received,
          null,
          2,
        )}\nexpected: ${JSON.stringify(target, null, 2)}`,
    };
  },
});

expect.extend({
  toBeAddress(received) {
    let pass = false;
    try {
      getAddress(received);
      pass = true;
    } catch (e) {
      /* noop */
    }
    return {
      pass,
      message: () => `${received} is not an address`,
    };
  },
});

expect.extend({
  toBeTxHash(received) {
    return {
      pass: !!(
        typeof received === 'string' && /^(0x)([0-9a-f]{2}){32}$/.exec(received)
      ),
      message: () => `${received} is not a txHash`,
    };
  },
});
