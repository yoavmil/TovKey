import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { PitchDetector } from 'pitchy';
import { freqToLabel, NOTE_FREQUENCIES } from '../note-utils';

@Injectable({ providedIn: 'root' })
export class AudioService {
  readonly isListening = signal(false);

  /** Fires once per detected/played note, with a 600 ms cooldown between events. */
  private readonly _noteDetected = new Subject<string>();
  readonly noteDetected$ = this._noteDetected.asObservable();

  private audioCtx?: AudioContext;
  private analyser?: AnalyserNode;
  private detector?: PitchDetector<Float32Array>;
  private rafId?: number;
  private lastEmitAt = 0;
  private static readonly COOLDOWN_MS = 600;

  async startListening(): Promise<void> {
    if (this.isListening()) return;
    this.audioCtx ??= new AudioContext();
    if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const source = this.audioCtx.createMediaStreamSource(stream);

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    source.connect(this.analyser);

    this.detector = PitchDetector.forFloat32Array(this.analyser.fftSize);
    this.isListening.set(true);
    this.tick();
  }

  stopListening(): void {
    if (this.rafId !== undefined) cancelAnimationFrame(this.rafId);
    this.isListening.set(false);
  }

  /** Play a synthesised piano-like tone and immediately register it as the detected note.
   *  Used for in-browser testing without a physical piano. */
  playNote(label: string): void {
    const freq = NOTE_FREQUENCIES[label];
    if (!freq) return;

    this.audioCtx ??= new AudioContext();

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const now = this.audioCtx.currentTime;

    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(now);
    osc.stop(now + 1.2);

    this.emit(label);
  }

  private tick(): void {
    if (!this.analyser || !this.detector || !this.audioCtx) return;

    const buffer = new Float32Array(this.detector.inputLength);
    this.analyser.getFloatTimeDomainData(buffer);
    const [freq, clarity] = this.detector.findPitch(buffer, this.audioCtx.sampleRate);

    // clarity > 0.92 filters out noise; freq range covers the full piano keyboard
    if (clarity > 0.92 && freq > 60 && freq < 2100) {
      this.emit(freqToLabel(freq));
    }

    this.rafId = requestAnimationFrame(() => this.tick());
  }

  private emit(label: string): void {
    const now = Date.now();
    if (now - this.lastEmitAt < AudioService.COOLDOWN_MS) return;
    this.lastEmitAt = now;
    this._noteDetected.next(label);
  }
}
