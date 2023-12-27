// @jest/global comes with jest
import crypto from 'node:crypto';
import { formatSecretValue } from '../src/common/sms/smsUtils.js';

describe('formatSecretValue', function () {
  describe('When secretValue is a base64 string', function () {
    it('should not change it', async function () {
      // --- GIVEN
      const secretValue = 'RG8geW91IGtub3cgaG93IHRvIHJlYWQgYmFzZTY0Pw==';

      // --- WHEN
      const formattedSecretValue = await formatSecretValue(secretValue);

      // --- THEN
      expect(formattedSecretValue).toBe(secretValue);
    });
  });

  describe('When secretValue is a PEM public key', function () {
    it('should encode it into base64', async function () {
      // --- GIVEN
      const secretValue = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA0gKRKKNCLe1O+A8nRsOc
gnnvLwE+rpvmKnjOTzoR8ZBTaIjD1dqlhPyJ3kgUnKyCNqru9ayf0srUddwj+20N
zdLvhI03cYD+GFYM6rrGvaUekGZ43f309f3wOrQjNkTeGo+K+hloHL/gmuN/XML9
MST/01+mdCImPdG+dxk4RQAsFS7HE00VXsVjcLGeZ95AKILFJKLbCOJxxvsQ+L1g
rameEwTUF1Mb5TJnV44YZJiCKYFj6/6zrZ3+pdUjxBSN96iOyE2KiYeNuhEEJbjb
4rWl+TpWLmDkLIeyL3TpDTRedaXVx6h7DOOphX5vG63+5UIHol3vJwPbeODiFWH0
hpFcFVPoW3wQgEpSMhUabg59Hc0rnXfM5nrIRS+SHTzjD7jpbSisGzXKcuHMc69g
brEHGJsNnxr0A65PzN1RMJGq44lnjeTPZnjWjM7PnnfH72MiWmwVptB38QP5+tao
UJu9HvZdCr9ZzdHebO5mCWIBKEt9bLRa2LMgAYfWVg21ARfIzjvc9GCwuu+958GR
O/VhIFB71aaAxpGmK9bX5U5QN6Tpjn/ykRIBEyY0Y6CJUkc33KhVvxXSirIpcZCO
OY8MsmW8+J2ZJI1JA0DIR2LHingtFWlQprd7lt6AxzcYSizeWVTZzM7trbBExBGq
VOlIzoTeJjL+SgBZBa+xVC0CAwEAAQ==
-----END PUBLIC KEY-----`;

      // --- WHEN
      const formattedSecretValue = await formatSecretValue(secretValue);

      // --- THEN
      expect(formattedSecretValue).toBe(
        'LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0KTUlJQ0lqQU5CZ2txaGtpRzl3MEJBUUVGQUFPQ0FnOEFNSUlDQ2dLQ0FnRUEwZ0tSS0tOQ0xlMU8rQThuUnNPYwpnbm52THdFK3Jwdm1LbmpPVHpvUjhaQlRhSWpEMWRxbGhQeUoza2dVbkt5Q05xcnU5YXlmMHNyVWRkd2orMjBOCnpkTHZoSTAzY1lEK0dGWU02cnJHdmFVZWtHWjQzZjMwOWYzd09yUWpOa1RlR28rSytobG9ITC9nbXVOL1hNTDkKTVNULzAxK21kQ0ltUGRHK2R4azRSUUFzRlM3SEUwMFZYc1ZqY0xHZVo5NUFLSUxGSktMYkNPSnh4dnNRK0wxZwpyYW1lRXdUVUYxTWI1VEpuVjQ0WVpKaUNLWUZqNi82enJaMytwZFVqeEJTTjk2aU95RTJLaVllTnVoRUVKYmpiCjRyV2wrVHBXTG1Ea0xJZXlMM1RwRFRSZWRhWFZ4Nmg3RE9PcGhYNXZHNjMrNVVJSG9sM3ZKd1BiZU9EaUZXSDAKaHBGY0ZWUG9XM3dRZ0VwU01oVWFiZzU5SGMwcm5YZk01bnJJUlMrU0hUempEN2pwYlNpc0d6WEtjdUhNYzY5ZwpickVIR0pzTm54cjBBNjVQek4xUk1KR3E0NGxuamVUUFpualdqTTdQbm5mSDcyTWlXbXdWcHRCMzhRUDUrdGFvClVKdTlIdlpkQ3I5WnpkSGViTzVtQ1dJQktFdDliTFJhMkxNZ0FZZldWZzIxQVJmSXpqdmM5R0N3dXUrOTU4R1IKTy9WaElGQjcxYWFBeHBHbUs5Ylg1VTVRTjZUcGpuL3lrUklCRXlZMFk2Q0pVa2MzM0toVnZ4WFNpcklwY1pDTwpPWThNc21XOCtKMlpKSTFKQTBESVIyTEhpbmd0RldsUXByZDdsdDZBeHpjWVNpemVXVlRaek03dHJiQkV4QkdxClZPbEl6b1RlSmpMK1NnQlpCYSt4VkMwQ0F3RUFBUT09Ci0tLS0tRU5EIFBVQkxJQyBLRVktLS0tLQ==',
      );
    });
  });

  describe('When secretValue is a browser CryptoKey', function () {
    beforeAll(() => {
      Object.defineProperty(globalThis, 'crypto', {
        value: crypto.webcrypto,
      });
      Object.defineProperty(globalThis, 'CryptoKey', {
        value: crypto.webcrypto.CryptoKey,
      });
    });

    it('should format it the correct way', async function () {
      // --- GIVEN
      const isExtractable = true;
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 4096,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        isExtractable,
        ['encrypt', 'decrypt'],
      );

      // --- WHEN
      const formattedSecretValue = await formatSecretValue(keyPair.publicKey);

      // --- THEN
      expect(
        // btoa() for '-----BEGIN PUBLIC KEY-----'
        formattedSecretValue.startsWith('LS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS0'),
      ).toBe(true);
    });
  });
});
