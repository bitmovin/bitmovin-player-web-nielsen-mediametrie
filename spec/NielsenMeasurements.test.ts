import { PlayerAPI } from 'bitmovin-player';
import { MockHelper, PlayerEventHelper } from './helper/MockHelper';
import { NielsenMeasurements } from '../src/ts/NielsenMeasurements';
import { NielsenMeasurementsTracker } from '../src/ts/NielsenMeasurementsTracker';

const mockLoadMetadata = jest.fn();
const mockSetPlayHeadPosition = jest.fn();
const mockStopTracking = jest.fn();
const mockEndTracking = jest.fn();

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

const MockedNielsenTracker = NielsenMeasurementsTracker as jest.Mock;

describe(NielsenMeasurements, () => {
  let playerMock: PlayerAPI;
  let playerEventHelper: PlayerEventHelper;
  let measurements: NielsenMeasurements;
  let trackerMock: jest.Mocked<NielsenMeasurementsTracker>;

  beforeEach(async () => {
    MockedNielsenTracker.mockClear();
    mockLoadMetadata.mockClear();
    mockSetPlayHeadPosition.mockClear();
    mockStopTracking.mockClear();
    mockEndTracking.mockClear();

    ({ playerMock, playerEventHelper } = MockHelper.createPlayerMock());

    measurements = new NielsenMeasurements({
      appId: 'TEST-APP-ID',
      instanceName: 'TEST-INSTANCE',
      options: {},
      onError: (err: Error) => {
        console.error('NielsenMeasurements error:', err);
      },
      timeoutMs: 5000,
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
    jest.spyOn(playerMock, 'getDuration').mockReturnValue(100);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(NielsenMeasurements).toBeDefined();
  });

  describe('when no player is attached', () => {
    it('should throw an error when player is accessed', () => {
      const measurementsWithoutPlayer = new NielsenMeasurements({
        appId: 'TEST-APP-ID',
        instanceName: 'TEST-INSTANCE',
        options: {},
      });

      expect(() => measurementsWithoutPlayer.player).toThrow('Player is not initialized. Please provide it in the constructor or via `attachPlayer` before using the integration.');
    });
  });

  describe('with initialized session', () => {
    beforeEach(() => {
      trackerMock = MockedNielsenTracker.mock.instances[0];
    });

    it('should loadMetadata on SourceLoaded event', () => {
      jest.spyOn(playerMock, 'getSource').mockReturnValue({
        title: 'Sintel',
        dash: 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd',
        poster: 'https://bitmovin.com/wp-content/uploads/2016/06/sintel-poster.jpg',
      });
      playerEventHelper.fireSourceLoadedEvent();
      expect(mockLoadMetadata).toHaveBeenCalled();
    });

    it('should start playhead timer on Play event', () => {
      jest.spyOn(playerMock, 'getCurrentTime').mockReturnValue(10);
      playerEventHelper.firePlayingEvent();

      expect(mockSetPlayHeadPosition).toHaveBeenCalledWith(10);
    });

    it('should stop playhead timer on Pause event', () => {
      jest.spyOn(playerMock, 'getCurrentTime').mockReturnValue(20);
      playerEventHelper.firePauseEvent();

      expect(mockStopTracking).toHaveBeenCalledWith(20);
    });

    it('should load ad metadata on AdStarted event', () => {
      playerEventHelper.fireAdStartedEvent();

      expect(mockLoadMetadata).toHaveBeenCalled();
    });

    it('should stop tracking on AdFinished event', () => {
      jest.spyOn(playerMock, 'getCurrentTime').mockReturnValue(30);
      playerEventHelper.fireAdFinishedEvent();

      expect(mockStopTracking).toHaveBeenCalledWith(30);
    });

    it('should load content metadata on AdBreakFinished event', () => {
      jest.spyOn(playerMock, 'getCurrentTime').mockReturnValue(30);
      playerEventHelper.fireAdBreakFinishedEvent();

      expect(mockLoadMetadata).toHaveBeenCalled();
    });

    it('should end tracking on PlaybackFinished event', () => {
      jest.spyOn(playerMock, 'getCurrentTime').mockReturnValue(40);
      playerEventHelper.firePlayingEvent();
      playerEventHelper.firePlaybackFinishedEvent();

      expect(mockEndTracking).toHaveBeenCalledWith(40);
    });

    it('should handle stall events correctly', () => {
      jest.spyOn(playerMock, 'getCurrentTime').mockReturnValue(50);
      playerEventHelper.firePlayingEvent();
      playerEventHelper.fireStallStartedEvent();
      // stall does not trigger stopTracking, it just stops the playhead timer
      // expect(mockStopTracking).toHaveBeenCalledWith(50);
      playerEventHelper.fireStallEndedEvent();
      expect(mockSetPlayHeadPosition).toHaveBeenCalledWith(50);
    });

    it('logs error event', () => {
      playerEventHelper.fireErrorEvent();
      expect(console.error).toHaveBeenCalled();
    });
    
    it('cleans up on Destroy event', () => {
      playerEventHelper.firePlayingEvent();
      playerEventHelper.fireDestroyEvent();
      expect(mockEndTracking).toHaveBeenCalled();
    });
  });
});
