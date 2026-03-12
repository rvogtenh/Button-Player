/**
 * Audio engine for Button-Player.
 *
 * Each engine instance owns its own masterGain node connected to the shared
 * audioContext.destination — safe for ?emulate=N (multiple instances, one context).
 *
 * Parameters come from the shared 'sound-params' state (read-only).
 * Call updateParams() whenever the state changes, then trigger() on button press.
 */
export class AudioEngine {
  constructor(audioContext, options) {
    this._ctx = audioContext;
    this._params = null;
    this._sampleBuffer = null;
    this._loadedSampleFile = null;
    this._onSampleReady = options?.onSampleReady ?? null;

    // Each engine instance routes through its own master gain
    this._masterGain = this._ctx.createGain();
    this._masterGain.connect(this._ctx.destination);
  }

  /**
   * Update internal parameter snapshot from state values.
   * Called with full state values on attach and on every onUpdate.
   */
  updateParams(values) {
    // Merge delta into existing params — onUpdate() delivers only changed keys
    this._params = { ...this._params, ...values };

    if ('masterGain' in values) {
      this._masterGain.gain.setValueAtTime(values.masterGain, this._ctx.currentTime);
    }

    // Pre-load sample whenever mode or file changes
    const p = this._params;
    if (p.mode === 'sample' && p.sampleFile !== this._loadedSampleFile) {
      this._loadSample(p.sampleFile);
    }
  }

  /**
   * Disconnect and release audio nodes. Call before discarding the engine.
   */
  dispose() {
    this._masterGain.disconnect();
  }

  /**
   * Trigger a sound event (called on pointerdown).
   */
  trigger() {
    if (!this._params) return;

    if (this._params.mode === 'synth') {
      this._playSynth();
    } else {
      this._playSample();
    }
  }

  // ---------------------------------------------------------------------------
  // Private

  _playSynth() {
    const ctx = this._ctx;
    const p = this._params;
    const now = ctx.currentTime;

    const envGain = ctx.createGain();
    envGain.connect(this._masterGain);

    // Build 3 oscillators
    const oscs = [0, 1, 2].map(i => {
      const osc = ctx.createOscillator();
      osc.type = p[`oscType${i}`];
      osc.frequency.value = p[`oscFreq${i}`];
      osc.connect(envGain);
      return osc;
    });

    // ADSR envelope
    const { attack, decay, sustain, release } = p;
    const peakLevel = 1 / 3; // normalize for 3 oscillators

    envGain.gain.setValueAtTime(0, now);
    envGain.gain.linearRampToValueAtTime(peakLevel, now + attack);
    envGain.gain.linearRampToValueAtTime(peakLevel * sustain, now + attack + decay);
    // Avoid ramping to exactly 0 (Web Audio spec does not allow exponential ramp to 0)
    envGain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay + release);

    const endTime = now + attack + decay + release + 0.01;

    oscs.forEach(osc => {
      osc.start(now);
      osc.stop(endTime);
    });
  }

  _playSample() {
    if (!this._sampleBuffer) return;

    const ctx = this._ctx;
    const p = this._params;
    const now = ctx.currentTime;
    const duration = this._sampleBuffer.duration;

    // Clamp attack + release to sample duration, preserving their ratio
    let attack = p.attack;
    let release = p.release;
    if (attack + release > duration) {
      const scale = duration / (attack + release);
      attack *= scale;
      release *= scale;
    }

    // Sustain phase fills the gap: duration - attack - release
    const sustainEnd = duration - release;

    const source = ctx.createBufferSource();
    source.buffer = this._sampleBuffer;

    const envGain = ctx.createGain();
    envGain.connect(this._masterGain);
    source.connect(envGain);

    // ASR envelope: rise → hold at 1 (sustain) → fall
    envGain.gain.setValueAtTime(0, now);
    envGain.gain.linearRampToValueAtTime(1, now + attack);
    if (sustainEnd > attack) {
      // Hold sustain level until release starts
      envGain.gain.setValueAtTime(1, now + sustainEnd);
    }
    envGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    source.start(now);
    source.stop(now + duration + 0.01);
  }

  hasSampleBuffer() { return this._sampleBuffer !== null; }

  getMode() { return this._params?.mode ?? null; }

  /**
   * Fetch and decode a sample file.
   * Uses callback-style decodeAudioData for Safari compatibility.
   */
  _loadSample(filename) {
    this._loadedSampleFile = filename;
    this._sampleBuffer = null;

    fetch(`/audio/${filename}`)
      .then(res => res.arrayBuffer())
      .then(arrayBuffer => {
        this._ctx.decodeAudioData(
          arrayBuffer,
          buffer => { this._sampleBuffer = buffer; this._onSampleReady?.(); },
          err => { console.error('[AudioEngine] decodeAudioData failed:', err); },
        );
      })
      .catch(err => {
        console.error('[AudioEngine] Failed to fetch sample:', err);
      });
  }
}
