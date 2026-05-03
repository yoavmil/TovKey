import { Injectable, signal } from '@angular/core';

export interface Note {
  name: string;
  midiNumber: number;
  /** The note letter without octave, e.g. 'C', 'D' */
  letter: string;
  /** Whether this is a sharp/flat */
  isAccidental: boolean;
}

export interface FallingNote {
  id: number;
  note: Note;
  /** Position from right (0 = just entered, 1 = at play line) */
  progress: number;
  /** Whether this note has been hit */
  hit: boolean;
  /** Whether this note was missed */
  missed: boolean;
}

export interface KeyState {
  note: Note;
  state: 'idle' | 'correct' | 'wrong' | 'highlight';
}

// C major scale notes (no sharps/flats) - one octave
const C_MAJOR_NOTES: Note[] = [
  { name: 'C4', midiNumber: 60, letter: 'C', isAccidental: false },
  { name: 'D4', midiNumber: 62, letter: 'D', isAccidental: false },
  { name: 'E4', midiNumber: 64, letter: 'E', isAccidental: false },
  { name: 'F4', midiNumber: 65, letter: 'F', isAccidental: false },
  { name: 'G4', midiNumber: 67, letter: 'G', isAccidental: false },
  { name: 'A4', midiNumber: 69, letter: 'A', isAccidental: false },
  { name: 'B4', midiNumber: 71, letter: 'B', isAccidental: false },
  { name: 'C5', midiNumber: 72, letter: 'C', isAccidental: false },
];

// Full piano keys for display (C4 to C5)
export const PIANO_KEYS: Note[] = [
  { name: 'C4', midiNumber: 60, letter: 'C', isAccidental: false },
  { name: 'C#4', midiNumber: 61, letter: 'C', isAccidental: true },
  { name: 'D4', midiNumber: 62, letter: 'D', isAccidental: false },
  { name: 'D#4', midiNumber: 63, letter: 'D', isAccidental: true },
  { name: 'E4', midiNumber: 64, letter: 'E', isAccidental: false },
  { name: 'F4', midiNumber: 65, letter: 'F', isAccidental: false },
  { name: 'F#4', midiNumber: 66, letter: 'F', isAccidental: true },
  { name: 'G4', midiNumber: 67, letter: 'G', isAccidental: false },
  { name: 'G#4', midiNumber: 68, letter: 'G', isAccidental: true },
  { name: 'A4', midiNumber: 69, letter: 'A', isAccidental: false },
  { name: 'A#4', midiNumber: 70, letter: 'A', isAccidental: true },
  { name: 'B4', midiNumber: 71, letter: 'B', isAccidental: false },
  { name: 'C5', midiNumber: 72, letter: 'C', isAccidental: false },
];

@Injectable({
  providedIn: 'root'
})
export class GameService {
  readonly fallingNotes = signal<FallingNote[]>([]);
  readonly keyStates = signal<KeyState[]>(
    PIANO_KEYS.map(n => ({ note: n, state: 'idle' as const }))
  );
  readonly score = signal(0);
  readonly combo = signal(0);
  readonly isPlaying = signal(false);
  readonly gameOver = signal(false);

  private noteIdCounter = 0;
  private spawnInterval: ReturnType<typeof setInterval> | null = null;
  private animationFrame: number | null = null;
  private lastTime = 0;
  private spawnTimer = 0;
  private readonly SPAWN_INTERVAL = 3000; // ms between notes
  private readonly NOTE_SPEED = 0.15; // progress per second
  private readonly PLAY_LINE_THRESHOLD = 0.85; // when note is near the play line

  /** Start the game */
  startGame(): void {
    this.fallingNotes.set([]);
    this.score.set(0);
    this.combo.set(0);
    this.gameOver.set(false);
    this.isPlaying.set(true);
    this.resetKeyStates();
    this.noteIdCounter = 0;
    this.spawnTimer = 0;

    // Spawn first note immediately
    this.spawnNote();

    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  /** Stop the game */
  stopGame(): void {
    this.isPlaying.set(false);
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = null;
    }
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /** Handle a key press from the user */
  pressKey(midiNumber: number): void {
    if (!this.isPlaying() || this.gameOver()) return;

    const activeNote = this.fallingNotes().find(
      n => !n.hit && !n.missed && n.progress >= this.PLAY_LINE_THRESHOLD - 0.1 && n.progress <= 1
    );

    if (!activeNote) return;

    const isCorrect = activeNote.note.midiNumber === midiNumber;

    if (isCorrect) {
      // Correct!
      this.score.update(s => s + 10 + this.combo() * 2);
      this.combo.update(c => c + 1);

      this.fallingNotes.update(notes =>
        notes.map(n => n.id === activeNote.id ? { ...n, hit: true } : n)
      );

      this.setKeyState(midiNumber, 'correct');
      setTimeout(() => this.setKeyState(midiNumber, 'idle'), 300);
    } else {
      // Wrong key pressed
      this.combo.set(0);

      // Highlight the correct key in yellow
      this.setKeyState(activeNote.note.midiNumber, 'highlight');
      setTimeout(() => this.setKeyState(activeNote.note.midiNumber, 'idle'), 500);

      // Show wrong key in red
      this.setKeyState(midiNumber, 'wrong');
      setTimeout(() => this.setKeyState(midiNumber, 'idle'), 300);
    }
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.isPlaying()) return;

    const deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Update note positions
    this.fallingNotes.update(notes => {
      let hasMissed = false;
      const updated = notes.map(n => {
        if (n.hit || n.missed) return n;
        const newProgress = n.progress + this.NOTE_SPEED * deltaTime;
        if (newProgress >= 1.2) {
          hasMissed = true;
          return { ...n, progress: newProgress, missed: true };
        }
        return { ...n, progress: newProgress };
      });

      if (hasMissed) {
        this.combo.set(0);
        // Check if any note passed the play line without being hit
        const missedAny = updated.some(n => n.missed && !n.hit);
        if (missedAny) {
          // Game over for now - in easy mode, just reset combo
          // We'll keep going but reset combo
        }
      }

      return updated;
    });

    // Spawn new notes periodically
    this.spawnTimer += deltaTime * 1000;
    if (this.spawnTimer >= this.SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      this.spawnNote();
    }

    this.animationFrame = requestAnimationFrame(this.gameLoop);
  };

  private spawnNote(): void {
    // Pick a random note from C major scale
    const note = C_MAJOR_NOTES[Math.floor(Math.random() * C_MAJOR_NOTES.length)];
    this.fallingNotes.update(notes => [
      ...notes,
      {
        id: this.noteIdCounter++,
        note,
        progress: 0,
        hit: false,
        missed: false,
      }
    ]);
  }

  private setKeyState(midiNumber: number, state: KeyState['state']): void {
    this.keyStates.update(states =>
      states.map(s => s.note.midiNumber === midiNumber ? { ...s, state } : s)
    );
  }

  private resetKeyStates(): void {
    this.keyStates.set(
      PIANO_KEYS.map(n => ({ note: n, state: 'idle' as const }))
    );
  }
}
