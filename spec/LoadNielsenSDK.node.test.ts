/**
 * @jest-environment node
 */

import { LoadNielsenSDK } from '../src/ts/LoadNielsenSDK';

describe('LoadNielsenSDK in a Node.js environment', () => {
  it('rejects because window is not defined', async () => {
    // On a separate node environment test file, here `window` is undefined.
    // No setup or teardown is needed.
    
    const onError = jest.fn();

    const config = {
      appId: 'PTEST',
      instanceName: 'testInstance',
      onError,
    };

    const promise = LoadNielsenSDK(config);

    await expect(promise).rejects.toThrow(
      'Nielsen SDK can only be loaded in a browser environment.'
    );

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    expect(onError.mock.calls[0][0].message).toBe(
      'Nielsen SDK can only be loaded in a browser environment.'
    );
  });
});