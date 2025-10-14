import { Ad, PlayerAPI } from 'bitmovin-player';
import { MockHelper, PlayerEventHelper } from './helper/MockHelper';
import { NielsenMeasurements } from '../src/ts/NielsenMeasurements';
import { NielsenMeasurementsTracker } from '../src/ts/NielsenMeasurementsTracker';
import { NielsenMetadata } from '../src/ts/NielsenMetadataBuilder';

jest.useFakeTimers();

const mockLoadMetadata = jest.fn();
const mockSetPlayHeadPosition = jest.fn();
const mockStopTracking = jest.fn();
const mockEndTracking = jest.fn();

jest.mock('../src/ts/LoadNielsenSDK', () => ({
  LoadNielsenSDK: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../src/ts/NielsenMeasurementsTracker', () => {
  return {
    NielsenMeasurementsTracker: jest.fn().mockImplementation(() => ({
      loadMetadata: mockLoadMetadata,
      setPlayHeadPosition: mockSetPlayHeadPosition,
      stopTracking: mockStopTracking,
      endTracking: mockEndTracking,
    })),
  };
});

const MockedNielsenTracker = NielsenMeasurementsTracker as unknown as jest.Mock;

describe('NielsenMeasurements extra scenarios', () => {
  let playerMock: PlayerAPI;
  let playerEventHelper: PlayerEventHelper;
  let measurements: NielsenMeasurements;

  beforeEach(async () => {
    jest.clearAllMocks();
    ({ playerMock, playerEventHelper } = MockHelper.createPlayerMock());

    measurements = new NielsenMeasurements({
      appId: 'TEST-APP-ID',
      instanceName: 'TEST-INSTANCE',
    });
    const metadata = {
      subbrand: 'my-subbrand',
      assetId: 'my-asset',
    };
    measurements.attachTo(playerMock, metadata);

    jest.spyOn(playerMock, 'getSource').mockReturnValue({
      dash: 'test.mpd',
      title: 'Asset Title',
    });

    // Allow constructor's promise .then to run (sets up tracker and beforeunload listener)
    await Promise.resolve();
  });

  it('ends session if stall exceeds timeout', () => {
    jest.spyOn(playerMock, 'getCurrentTime').mockReturnValue(60);

    playerEventHelper.firePlayingEvent();
    playerEventHelper.fireStallStartedEvent();

    jest.advanceTimersByTime(30000);

    expect(mockEndTracking).toHaveBeenCalledWith(60);
  });

  it('calls endTracking on beforeunload', async () => {
    jest.spyOn(playerMock, 'getCurrentTime').mockReturnValue(77);

    window.dispatchEvent(new Event('beforeunload'));

    expect(mockEndTracking).toHaveBeenCalledWith(77);
  });
});

describe('NielsenAnalytics with custom metadata builders', () => {
  let playerMock: PlayerAPI;
  let playerEventHelper: PlayerEventHelper;
  let analytics: NielsenMeasurements;

  beforeEach(() => {
    jest.clearAllMocks();
    ({ playerMock, playerEventHelper } = MockHelper.createPlayerMock());
  });

  it('uses buildContentMetadata', async () => {
    const mockMetadata: NielsenMetadata = {
      type: 'ad',
      assetId: 'my-custom-ad-id',
      program: 'My Custom Ad Program',
      title: 'My Ad',
      length: 1,
      islive: 'n',
      subbrand: 'my-subbrand',
    };
    analytics = new NielsenMeasurements({
      appId: 'TEST-APP-ID',
      instanceName: 'TEST-INSTANCE',
      metadataBuilder: {
        buildContentMetadata: (player: PlayerAPI): NielsenMetadata => {
          return mockMetadata
        }
      }
    });
    const metadata = {
      subbrand: 'my-subbrand',
      assetId: 'my-custom-ad-id',
    };
    analytics.attachTo(playerMock, metadata);
    await Promise.resolve();
    
    jest.spyOn(playerMock, 'getCurrentTime').mockReturnValue(70);
    playerEventHelper.firePlayingEvent();
    expect(mockSetPlayHeadPosition).toHaveBeenCalled();
    playerEventHelper.fireSourceLoadedEvent();
    expect(mockLoadMetadata).toHaveBeenCalledWith(mockMetadata)
  });

  it('uses buildAdMetadata', async () => {
    const mockMetadata: NielsenMetadata = {
            type: 'ad',
            assetId: 'my-custom-ad-id',
            program: 'My Custom Ad Program',
            title: 'My Ad',
            length: 60,
            islive: 'n',
            subbrand: 'my-subbrand',
          };
    analytics = new NielsenMeasurements({
      appId: 'TEST-APP-ID',
      instanceName: 'TEST-INSTANCE',
      metadataBuilder: {
        buildAdMetadata: (ad: Ad, player: PlayerAPI): NielsenMetadata => {
          return mockMetadata
        }
      }
    });
    const metadata = {
      subbrand: 'my-subbrand',
      assetId: 'my-custom-ad-id',
    };
    analytics.attachTo(playerMock, metadata);
    await Promise.resolve();

    jest.spyOn(playerMock, 'getCurrentTime').mockReturnValue(80);
    playerEventHelper.firePlayingEvent();
    expect(mockSetPlayHeadPosition).toHaveBeenCalled()
    playerEventHelper.fireAdStartedEvent();
    expect(mockLoadMetadata).toHaveBeenCalledWith(mockMetadata)
  });
});

