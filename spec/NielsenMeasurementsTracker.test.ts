import { NielsenMeasurementsTracker } from '../src/ts/NielsenMeasurementsTracker';

describe('NielsenMeasurementsTracker', () => {
  const instanceName = 'testInstance';
  let ggPM: jest.Mock;
  let tracker: NielsenMeasurementsTracker;

  beforeEach(() => {
    ggPM = jest.fn();
    (window as any).NOLBUNDLE = {
      [instanceName]: {
        ggPM,
      },
    };

    tracker = new NielsenMeasurementsTracker(instanceName);
  });

  afterEach(() => {
    delete (window as any).NOLBUNDLE;
    jest.clearAllMocks();
  });

  it('calls loadMetadata with correct arguments', () => {
    const metadata = { assetId: '123', type: 'content' };
    tracker.loadMetadata(metadata);
    expect(ggPM).toHaveBeenCalledWith('loadMetadata', metadata);
  });

  it('calls stopTracking with playhead position', () => {
    tracker.stopTracking(42);
    expect(ggPM).toHaveBeenCalledWith('stop', 42);
  });

  it('calls endTracking with playhead position', () => {
    tracker.endTracking(84);
    expect(ggPM).toHaveBeenCalledWith('end', 84);
  });

  it('calls setPlayHeadPosition with playhead position', () => {
    tracker.setPlayHeadPosition(99);
    expect(ggPM).toHaveBeenCalledWith('setPlayheadPosition', 99);
  });

  it('does nothing if SDK instance is not ready', () => {
    delete (window as any).NOLBUNDLE;
    tracker = new NielsenMeasurementsTracker(instanceName);

    expect(() => tracker.setPlayHeadPosition(10)).toThrow();
    expect(() => tracker.endTracking(10)).toThrow();
    expect(() => tracker.stopTracking(10)).toThrow();
    expect(() => tracker.loadMetadata({})).toThrow();
  });

  it('throws error if sdkInstance is missing', () => {
  delete (window as any).NOLBUNDLE;
  tracker = new NielsenMeasurementsTracker(instanceName);

  expect(() => {
    (tracker as any).sdkInstance;
  }).toThrowError(`Nielsen SDK instance "${instanceName}" is not initialized.`);
});
});
