import { PlayerEvent } from './PlayerEvent';
import {
  AdBreakEvent,
  AdEvent,
  PlaybackEvent,
  ErrorEvent,
  PlayerAPI,
  PlayerEventBase,
  PlayerEventCallback,
  SeekEvent,
  TimeShiftEvent,
  VideoPlaybackQualityChangedEvent,
  CastStartedEvent,
  AudioChangedEvent,
  SubtitleEvent,
  VideoQuality,
} from 'bitmovin-player';
import { ArrayUtils } from 'bitmovin-player-ui/dist/js/framework/arrayutils';

declare const global: any;
export namespace MockHelper {
  export function createPlayerMock(): {
    playerMock: PlayerAPI,
    playerEventHelper: PlayerEventHelper
  } {
    const playerEventHelper = new PlayerEventHelper();

    const PlayerMock: jest.Mock<PlayerAPI> = jest.fn().mockImplementation(() => {
      return {
        version: '8.0.0',
        getSource: jest.fn(),
        exports: {
          PlayerEvent,
          MetadataType: {
            CAST: 'CAST',
          },
        },
        getAudio: jest.fn(() => {
          return {
            id: 'en',
            lang: 'en',
            label: 'English',
            getQualities: jest.fn(),
          };
        }),
        getDuration: jest.fn(),
        getCurrentTime: jest.fn(),
        isLive: jest.fn(),
        getConfig: jest.fn(() => {
          return {};
        }),
        isPlaying: jest.fn().mockReturnValue(true),
        isPaused: jest.fn().mockReturnValue(false),
        isStalled: jest.fn().mockReturnValue(false),
        isCasting: jest.fn(),
        getPlayerType: jest.fn(),
        getStreamType: jest.fn(() => 'hls'),
        addMetadata: jest.fn((_, metadata) => {
          // Calling metadata listener
          if (global.gcr && global.gcr.castMetadataListenerCallback) {
            global.gcr.castMetadataListenerCallback(metadata);
          }
        }),
        subtitles: {
          list: jest.fn((): any[] => []),
        },
        on: (eventType: PlayerEvent, callback: PlayerEventCallback) => playerEventHelper.on(eventType, callback),
        off: (eventType: PlayerEvent, callback: PlayerEventCallback) => playerEventHelper.off(eventType, callback),
        getPlaybackVideoData: jest.fn(() => {
          const data: VideoQuality = {
            bitrate: 1024,
            id: 'test-video-quality',
            width: 100,
            height: 100,
            frameRate: 60
          }
          return data;
        })
      };
    });

    const playerMock = new PlayerMock();

    return {
      playerMock,
      playerEventHelper
    }
  }
}

export class PlayerEventHelper {
  private eventHandlers: { [eventType: string]: PlayerEventCallback[] } = {};

  public on(eventType: PlayerEvent, callback: PlayerEventCallback) {
    if (!this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = [];
    }

    this.eventHandlers[eventType].push(callback);
  }

  public off(eventType: PlayerEvent, callback: PlayerEventCallback) {
    if (this.eventHandlers[eventType]) {
      ArrayUtils.remove(this.eventHandlers[eventType], callback);
    }
  }

  public fireEvent<E extends PlayerEventBase>(event: E) {
    if (this.eventHandlers[event.type]) {
      this.eventHandlers[event.type].forEach((callback: PlayerEventCallback) => callback(event));
    }
  }

  // Fake Events
  public fireSourceLoadedEvent() {
    this.fireEvent<PlaybackEvent>({
      time: 0,
      timestamp: Date.now(),
      type: PlayerEvent.SourceLoaded,
    });
  }

  public firePlayEvent() {
    this.fireEvent<PlaybackEvent>({
      time: 0,
      timestamp: Date.now(),
      type: PlayerEvent.Play,
    });
  }

  public firePauseEvent() {
    this.fireEvent<PlaybackEvent>({
      time: 10,
      timestamp: Date.now(),
      type: PlayerEvent.Paused,
    });
  }

  fireRestoringContentEvent(): void {
    this.fireEvent<PlayerEventBase>({
      timestamp: Date.now(),
      type: PlayerEvent.RestoringContent,
    });
  }

  fireAdBreakFinishedEvent(): void {
    this.fireEvent<AdBreakEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.AdBreakFinished,
      adBreak: {
        id: 'Break-ID',
        scheduleTime: -1,
      },
    });
  }

  fireAdBreakStartedEvent(startTime: number): void {
    this.fireEvent<AdBreakEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.AdBreakStarted,
      adBreak: {
        id: 'Break-ID',
        scheduleTime: startTime,
      },
    });
  }

  fireAdErrorEvent(): void {
    this.fireEvent<ErrorEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.AdError,
      code: 1001,
      name: 'AdErrorEvent',
      troubleShootLink: "http://troubleshoot-test-link"
    });
  }

  fireAdSkippedEvent(): void {
    this.fireEvent<AdEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.AdSkipped,
      ad: {
        isLinear: true,
        width: 0,
        height: 0,
      },
    });
  }

  fireAdStartedEvent(): void {
    this.fireEvent<AdEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.AdStarted,
      ad: {
        id: 'Ad-ID',
        mediaFileUrl: 'https://example.com/ad.mp4',
        isLinear: true,
        data: {
          bitrate: 1000,
        },
        width: 0,
        height: 0,
      },
    });
  }

  fireAdFinishedEvent(): void {
    this.fireEvent<AdEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.AdFinished,
      ad: {
        id: 'Ad-ID',
        isLinear: true,
        width: 0,
        height: 0,
      },
    });
  }

  fireErrorEvent(): void {
    this.fireEvent<ErrorEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.Error,
      code: 1000,
      name: 'ErrorEvent',
      troubleShootLink: "http://troubleshoot-test-link"
    });
  }

  firePlaybackFinishedEvent(): void {
    this.fireEvent<PlayerEventBase>({
      timestamp: Date.now(),
      type: PlayerEvent.PlaybackFinished,
    });
  }

  firePlayingEvent(): void {
    this.fireEvent<PlaybackEvent>({
      time: 0,
      timestamp: Date.now(),
      type: PlayerEvent.Playing,
    });
  }

  fireSeekEvent(seekTarget?: number): void {
    this.fireEvent<SeekEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.Seek,
      position: 20,
      seekTarget: seekTarget || 40,
    });
  }

  fireSeekedEvent(): void {
    this.fireEvent<PlayerEventBase>({
      timestamp: Date.now(),
      type: PlayerEvent.Seeked,
    });
  }

  fireSourceUnloadedEvent(): void {
    this.fireEvent<PlayerEventBase>({
      timestamp: Date.now(),
      type: PlayerEvent.SourceUnloaded,
    });
  }

  fireStallStartedEvent(): void {
    this.fireEvent<PlayerEventBase>({
      timestamp: Date.now(),
      type: PlayerEvent.StallStarted,
    });
  }

  fireStallEndedEvent(): void {
    this.fireEvent<PlayerEventBase>({
      timestamp: Date.now(),
      type: PlayerEvent.StallEnded,
    });
  }

  fireDestroyEvent(): void {
    this.fireEvent<PlayerEventBase>({
      timestamp: Date.now(),
      type: PlayerEvent.Destroy,
    });
  }

  fireTimeShiftEvent(): void {
    this.fireEvent<TimeShiftEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.TimeShift,
      position: 0,
      target: -10,
    });
  }

  fireTimeShiftedEvent(): void {
    this.fireEvent<PlayerEventBase>({
      timestamp: Date.now(),
      type: PlayerEvent.TimeShifted,
    });
  }

  fireVideoPlaybackQualityChangedEvent(bitrate: number): void {
    this.fireEvent<VideoPlaybackQualityChangedEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.VideoPlaybackQualityChanged,
      sourceQuality: {
        id: '1',
        bitrate: 250_000,
        width: 0,
        height: 0,
      },
      targetQuality: {
        id: '2',
        bitrate: bitrate,
        width: 0,
        height: 0,
      },
    });
  }

  fireCastStartedEvent(resuming: boolean = false): void {
    this.fireEvent<CastStartedEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.CastStarted,
      deviceName: 'Awesome Device',
      resuming: resuming,
    });
  }

  fireCastStoppedEvent(): void {
    this.fireEvent<PlayerEventBase>({
      timestamp: Date.now(),
      type: PlayerEvent.CastStopped,
    });
  }

  fireCastWaitingForDevice(resuming: boolean = false): void {
    this.fireEvent<CastStartedEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.CastWaitingForDevice,
      deviceName: 'MyCastDevice',
      resuming: false,
    });
  }
  fireAudioChanged(): void {
    this.fireEvent<AudioChangedEvent>({
      timestamp: Date.now(),
      type: PlayerEvent.AudioChanged,
      sourceAudio: {
        id: 'en',
        lang: 'en',
        label: 'English',
        getQualities: jest.fn(),
      },
      targetAudio: {
        id: 'es',
        lang: 'es',
        label: 'Spanish',
        getQualities: jest.fn(),
      },
      time: 10,
    });
  }

  fireSubtitleEnabled(kind: string): void {
    this.fireEvent<SubtitleEvent>({
      subtitle: {
        id: 'en',
        kind: kind,
        lang: 'en',
        label: 'English',
      },
      timestamp: Date.now(),
      type: PlayerEvent.SubtitleEnabled,
    });
  }

  fireSubtitleDisabled(kind: string): void {
    this.fireEvent<SubtitleEvent>({
      subtitle: {
        id: 'en',
        kind: kind,
        lang: 'en',
        label: 'English',
      },
      timestamp: Date.now(),
      type: PlayerEvent.SubtitleDisabled,
    });
  }
}
