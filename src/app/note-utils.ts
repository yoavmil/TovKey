export interface NoteEntry {
  key: string;        // VexFlow format: 'c/4', 'f#/5'
  accidental?: string;
}

export type NoteState = 'pending' | 'active' | 'correct' | 'wrong';

/** 'f#/5' → 'F#5',  'c/4' → 'C4' */
export function vexKeyToLabel(key: string): string {
  const [note, octave] = key.split('/');
  return note.charAt(0).toUpperCase() + note.slice(1) + octave;
}

/** 440 → 'A4',  261.6 → 'C4' */
export function freqToLabel(freq: number): string {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const semitones = Math.round(12 * Math.log2(freq / 440));
  const index = ((semitones % 12) + 12 + 9) % 12;
  const octave = Math.floor((semitones + 9) / 12) + 4;
  return `${NOTE_NAMES[index]}${octave}`;
}

export const NOTE_FREQUENCIES: Record<string, number> = {
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81,
  'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00,
  'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63,
  'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00,
  'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25,
  'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00,
  'A#5': 932.33, 'B5': 987.77,
};

export const NOTE_POOL: NoteEntry[] = [
  { key: 'c/4' }, { key: 'd/4' }, { key: 'e/4' }, { key: 'f/4' },
  { key: 'g/4' }, { key: 'a/4' }, { key: 'b/4' }, { key: 'c/5' },
  { key: 'd/5' }, { key: 'e/5' }, { key: 'f#/5', accidental: '#' }, { key: 'g/5' },
];
