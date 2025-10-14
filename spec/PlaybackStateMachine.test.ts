import { PlaybackStateMachine, PlaybackState } from '../src/ts/helper/PlaybackStateMachine';

describe('PlaybackStateMachine', () => {
  it('handles allowed transitions', () => {
    const sm = new PlaybackStateMachine();

    expect(sm.currentState).toBe(PlaybackState.Idle);
    expect(sm.onPlay()).toBe(true);
    expect(sm.currentState).toBe(PlaybackState.Playing);

    expect(sm.onStop()).toBe(true);
    expect(sm.currentState).toBe(PlaybackState.Stopped);

    expect(sm.onPlay()).toBe(true);
    expect(sm.currentState).toBe(PlaybackState.Playing);
  });

  it('blocks invalid transitions', () => {
    const sm = new PlaybackStateMachine();

    // From Idle to Ended is invalid
    expect(sm.transitionTo(PlaybackState.Ended)).toBe(false);
    expect(sm.currentState).toBe(PlaybackState.Idle);

    // Move to Playing
    expect(sm.onPlay()).toBe(true);
    expect(sm.currentState).toBe(PlaybackState.Playing);

    // Playing -> Playing invalid
    expect(sm.transitionTo(PlaybackState.Playing)).toBe(false);
    expect(sm.currentState).toBe(PlaybackState.Playing);

    // End playback
    expect(sm.onEnd()).toBe(true);
    expect(sm.currentState).toBe(PlaybackState.Ended);

    // Ended -> Stopped invalid
    expect(sm.onStop()).toBe(false);
    expect(sm.currentState).toBe(PlaybackState.Ended);

    // Ended -> Idle allowed
    expect(sm.transitionTo(PlaybackState.Idle)).toBe(true);
    expect(sm.currentState).toBe(PlaybackState.Idle);
  });
});


