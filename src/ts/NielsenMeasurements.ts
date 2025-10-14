import { Ad, AdEvent, ErrorEvent, PlayerAPI, PlayerEvent } from 'bitmovin-player';
import { LoadNielsenSDK } from './LoadNielsenSDK';
import { NielsenMeasurementsTracker } from './NielsenMeasurementsTracker';
import { PlayerEventWrapper } from './helper/PlayerEventWrapper';
import { PlaybackState, PlaybackStateMachine } from './helper/PlaybackStateMachine';
import { NielsenMetadataBuilder, NielsenMetadata, NielsenUserProvidedContentMetadata } from './NielsenMetadataBuilder';

// Configuration object for initializing NielsenMeasurements
type NielsenMeasurementsConfig = {
  appId: string;
  instanceName: string;
  options?: Record<string, string>;
  onError?: (err: Error) => void;
  timeoutMs?: number;
  /**
   * Optional custom builders for metadata objects.
   * Allows overriding the default metadata creation logic.
   *
   * @example
   * ```ts
   * const config = {
   *   // ... other config
   *   metadataBuilder: {
   *     buildAdMetadata: (ad: Ad, player: PlayerAPI): NielsenMetadata => {
   *       // custom logic to build and return NielsenMetadata
   *       return {
   *         type: 'ad',
   *         assetid: 'my-custom-ad-id',
   *         program: 'My Custom Ad Program',
   *         title: ad.data?.adTitle ?? 'My Ad',
   *         length: ad.duration ?? 60,
   *         islive: 'n',
   *         subbrand: 'my-subbrand',
   *       };
   *     }
   *   }
   * }
   * ```
   */
  metadataBuilder?: {
    buildContentMetadata?: (player: PlayerAPI) => NielsenMetadata;
    buildAdMetadata?: (ad: Ad, player: PlayerAPI) => NielsenMetadata;
  };
};

/**
 * Bridge class between Bitmovin Player SDK and Nielsen SDK
 * Handles event mapping, metadata loading, and playhead tracking
 */
export class NielsenMeasurements {
  private stateMachine = new PlaybackStateMachine();
  private handlers?: PlayerEventWrapper;
  private _player?: PlayerAPI;
  private tracker?: NielsenMeasurementsTracker;
  private timerId?: number;
  private lastPlayhead: number = -1;
  private stallTimeoutId?: number;
  private readonly MAX_STALL_DURATION_MS = 30000;
  // Content metadata that can be pre-loaded when attaching to a player
  private contentMetadata?: NielsenUserProvidedContentMetadata;

  get player(): PlayerAPI {
    if (!this._player) {
      throw new Error(
        'Player is not initialized. Please provide it in the constructor or via `attachPlayer` before using the integration.',
      );
    }
    return this._player;
  }

  constructor(private config: NielsenMeasurementsConfig) {
    LoadNielsenSDK(config)
      .then(() => {
        window.addEventListener('beforeunload', this.onBeforeUnload);
        this.tracker = new NielsenMeasurementsTracker(config.instanceName);
      })
      .catch((err) => {
        config.onError?.(err);
      });
  }

  /**
   * Attach to a Bitmovin player instance
   */
  public attachTo(player: PlayerAPI, preloadedContentMetadata?: NielsenUserProvidedContentMetadata): void {
    this._player = player;
    if (preloadedContentMetadata) this.contentMetadata = preloadedContentMetadata;
    this.handlers = new PlayerEventWrapper(player);
    this.registerPlayerEvents();
  }

  /**
   * Register handlers for selected Bitmovin Player events.
   * These events are forwarded to the Nielsen SDK tracker as needed.
   * Ref: https://cdn.bitmovin.com/player/web/8/docs/enums/Core.PlayerEvent.html
   */
  private registerPlayerEvents(): void {
    const add = this.handlers!.add.bind(this.handlers!);

    add(PlayerEvent.SourceLoaded, this.onSourceLoaded); // Fired when a new source is loaded
    add(PlayerEvent.SourceUnloaded, this.onSourceUnloaded); // Fired when a new source is loaded
    add(PlayerEvent.Playing, this.onPlay); // Fired when playback starts/resumes
    add(PlayerEvent.Paused, this.onStop); // Fired when playback is paused
    add(PlayerEvent.AdBreakFinished, this.onAdBreakFinished); // Fired when ad break ends
    add(PlayerEvent.AdStarted, this.onAdStarted); // Fired when an ad starts
    add(PlayerEvent.AdFinished, this.onAdFinished); // Fired when an ad finishes
    add(PlayerEvent.PlaybackFinished, this.onPlaybackFinished); // Fired when main content playback ends
    add(PlayerEvent.Destroy, this.onDestroy); // Treat destroy as finalization
    add(PlayerEvent.StallStarted, this.onStall); // Fired on buffering/stall start
    add(PlayerEvent.StallEnded, this.onStallEnded); // Fired on buffering/stall end
    add(PlayerEvent.Error, this.onError); // Fired on any player error
  }

  /**
   * Starts the 1-second interval timer that updates playhead position
   */
  private startPlayheadTimer(): void {
    if (this.timerId) return; // prevent duplication

    const updatePlayhead = () => {
      const current = Math.floor(this.player.getCurrentTime());
      if (current !== this.lastPlayhead) {
        this.lastPlayhead = current;
        this.tracker?.setPlayHeadPosition(current);
      }
    };

    updatePlayhead();
    this.timerId = window.setInterval(updatePlayhead, 1000);
  }

  /**
   * Stops the playhead timer
   */
  private stopPlayheadTimer(): void {
    if (this.timerId !== undefined) {
      window.clearInterval(this.timerId);
      this.timerId = undefined;
    }
  }

  /**
   * Start of events
   */
  private onSourceLoaded = () => {
    try {
      this.loadMetadataForContent();
    } catch (error) {
      console.error('Could not create content metadata:', error.message);
    }
  };

  private onSourceUnloaded = () => {
    /**
     * Calling the onPlaybackFinished function, as the behaviour is exactly the same as needed 
     * when the source is unloaded.
     */
    this.onPlaybackFinished();
  };

  private onPlay = () => {
    if(this.stateMachine.currentState == PlaybackState.Ended){
      this.loadMetadataForContent();
    }
    if (this.stateMachine.onPlay()) {
      this.startPlayheadTimer();
    }
  };

  private onStop = () => {
    if (this.stateMachine.onStop()) {
      this.stopPlayheadTimer();
      const pos = Math.floor(this.player.getCurrentTime());
      this.tracker?.stopTracking(pos);
    }
  };

  private onAdBreakFinished = () => {
    this.loadMetadataForContent();
    this.startPlayheadTimer();
  };

  private onAdStarted = (e: AdEvent) => {
    try {
      const adMetadata = this.config.metadataBuilder?.buildAdMetadata
        ? this.config.metadataBuilder.buildAdMetadata(e.ad, this.player)
        : new NielsenMetadataBuilder({
            type: 'ad',
            ...this.contentMetadata,
          })
            .withLength(this.player.getDuration())
            .withAd(e.ad)
            .build();
      this.tracker?.loadMetadata(adMetadata);
      this.startPlayheadTimer();
    } catch (error) {
      console.error('Could not create ad metadata:', error.message);
    }
  };

  private onAdFinished = () => {
    const pos = Math.floor(this.player.getCurrentTime());
    this.tracker?.stopTracking(pos);
  };

  private onPlaybackFinished = () => {
    if (this.stateMachine.onEnd()) {
      this.stopPlayheadTimer();
      const pos = Math.floor(this.player.getCurrentTime());
      this.tracker?.endTracking(pos);
    }
  };

  private onStall = () => {
    if (this.stateMachine.onStop()) {
      this.stopPlayheadTimer();

      this.stallTimeoutId = window.setTimeout(() => {
        // Stall has lasted more than 30s, stop session
        const pos = Math.floor(this.player.getCurrentTime());
        console.warn('Stall over limit, ending session');
        this.tracker?.endTracking(pos);
        this.stateMachine.onEnd();
      }, this.MAX_STALL_DURATION_MS);
    }
  };

  private onStallEnded = () => {
    if (this.stateMachine.onPlay()) {
      if (this.stallTimeoutId) {
        window.clearTimeout(this.stallTimeoutId);
        this.stallTimeoutId = undefined;
      }

      this.startPlayheadTimer();
    }
  };

  private onDestroy = () => {
    this.onPlaybackFinished();
    this.handlers?.clear();
    window.removeEventListener('beforeunload', this.onBeforeUnload);
  };

  private onBeforeUnload = () => {
    this.stopPlayheadTimer();
    const pos = Math.floor(this.player.getCurrentTime());
    this.tracker?.endTracking(pos);
  };

  private onError = (event: ErrorEvent) => {
    console.error('Player Error', event);
  };

  private loadMetadataForContent() {
    const metadata = this.config.metadataBuilder?.buildContentMetadata
      ? this.config.metadataBuilder.buildContentMetadata(this.player)
      : new NielsenMetadataBuilder({
        type: 'content',
        ...this.contentMetadata,
      })
        .withContent(this.player)
        .build();
    this.tracker?.loadMetadata(metadata);
  }
}
