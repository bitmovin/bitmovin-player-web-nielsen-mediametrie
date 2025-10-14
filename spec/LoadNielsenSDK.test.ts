import { LoadNielsenSDK } from '../src/ts/LoadNielsenSDK';

jest.useFakeTimers();

describe('LoadNielsenSDK', () => {
  const originalWindow = { ...window };
  let insertBeforeMock: jest.Mock;

  beforeEach(() => {
    delete (window as any).NOLBUNDLE;
    delete (window as any).nSdkInstance;

    document.head.innerHTML = '';

    insertBeforeMock = jest.fn();
    const fakeScript = {
      parentNode: {
        insertBefore: insertBeforeMock,
      },
    };

    jest.spyOn(document, 'getElementsByTagName').mockReturnValue([fakeScript as any] as any);
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
    Object.assign(window, originalWindow);
  });

  it('successfully injects Nielsen SDK and resolves when ready', async () => {
    const mockSdkInstance = { ggPM: jest.fn() };

    (window as any).NOLBUNDLE = {
      nlsQ: jest.fn().mockImplementation((appid, name, options) => {
        (window as any).NOLBUNDLE[name] = mockSdkInstance;
        return mockSdkInstance;
      }),
    };

    const promise = LoadNielsenSDK({
      appId: 'PTEST',
      instanceName: 'testInstance',
    });

    jest.runOnlyPendingTimers();

    await expect(promise).resolves.toBeUndefined();
    expect((window as any).nSdkInstance).toBe(mockSdkInstance);
  });

  it('handles timeout if SDK does not load', async () => {
    (window as any).NOLBUNDLE = {
      nlsQ: jest.fn().mockReturnValue({}),
    };

    const onError = jest.fn();

    const promise = LoadNielsenSDK({
      appId: 'PTEST',
      instanceName: 'testInstance',
      onError,
      timeoutMs: 5000,
    });

    jest.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow('Nielsen SDK load timeout.');
    expect(onError).toHaveBeenCalled();
  }, 10000);

  it('does not re-inject if already initialized', async () => {
    const mockInstance = { ggPM: jest.fn() };
    (window as any).NOLBUNDLE = { testInstance: mockInstance };
    (window as any).nSdkInstance = undefined;

    await expect(
      LoadNielsenSDK({
        appId: 'PTEST',
        instanceName: 'testInstance',
      }),
    ).resolves.toBeUndefined();

    expect((window as any).nSdkInstance).toBe(mockInstance);
  });

  it('passes optout, enableFpid and debug flags in options', async () => {
    const mockSdkInstance = { ggPM: jest.fn() };
    const nlsQMock = jest.fn().mockImplementation((_appId, _instanceName, options) => {
      (window as any).NOLBUNDLE.testInstance = mockSdkInstance;
      return mockSdkInstance;
    });

    (window as any).NOLBUNDLE = {
      nlsQ: nlsQMock,
    };

    const promise = LoadNielsenSDK({
      appId: 'PTEST',
      instanceName: 'testInstance',
      optout: true,
      enableFpid: false,
      debug: true,
    });

    jest.runOnlyPendingTimers();
    await promise;

    expect(nlsQMock).toHaveBeenCalledWith(
      'PTEST',
      'testInstance',
      expect.objectContaining({
        optout: 'true',
        enableFpid: 'false',
        nol_sdkDebug: 'debug',
      }),
    );

    expect((window as any).nSdkInstance).toBe(mockSdkInstance);
  });
});