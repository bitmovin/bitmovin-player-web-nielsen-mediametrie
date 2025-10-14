export enum PlaybackState {
  Idle,
  Playing,
  Stopped,
  Ended,
}

/**
 * PlaybackStateMachine manages the playback state transitions.
 * Helps us avoid duplicate state changes and ensures valid transitions.
 */
export class PlaybackStateMachine {
  private state: PlaybackState = PlaybackState.Idle;

  get currentState(): PlaybackState {
    return this.state;
  }

  transitionTo(newState: PlaybackState): boolean {
    // Allowed transitions:
    // - Idle → Playing, Paused
    // - Playing → Paused, Ended
    // - Paused → Playing, Ended
    // - Ended → Idle (reset) or no transitions

    switch (this.state) {
      case PlaybackState.Idle:
        if (newState === PlaybackState.Playing || newState === PlaybackState.Stopped) {
          this.state = newState;
          return true;
        }
        return false;

      case PlaybackState.Playing:
        if (newState === PlaybackState.Stopped || newState === PlaybackState.Ended) {
          this.state = newState;
          return true;
        }
        return false;

      case PlaybackState.Stopped:
        if (newState === PlaybackState.Playing || newState === PlaybackState.Ended) {
          this.state = newState;
          return true;
        }
        return false;

      case PlaybackState.Ended:
        if (newState === PlaybackState.Idle || newState === PlaybackState.Playing) {
          this.state = newState;
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  onPlay(): boolean {
    return this.transitionTo(PlaybackState.Playing);
  }

  onStop(): boolean {
    return this.transitionTo(PlaybackState.Stopped);
  }

  onEnd(): boolean {
    return this.transitionTo(PlaybackState.Ended);
  }
}
