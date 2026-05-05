export interface NoteEntry {
  key: string;        // VexFlow format: 'c/4', 'f#/5'
  accidental?: string;
  clef: 'treble' | 'bass';
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

export const TREBLE_POOL: NoteEntry[] = [
  { key: 'c/4', clef: 'treble' }, { key: 'd/4', clef: 'treble' }, { key: 'e/4', clef: 'treble' }, { key: 'f/4', clef: 'treble' },
  { key: 'g/4', clef: 'treble' }, { key: 'a/4', clef: 'treble' }, { key: 'b/4', clef: 'treble' }, { key: 'c/5', clef: 'treble' },
  { key: 'd/5', clef: 'treble' }, { key: 'e/5', clef: 'treble' }, { key: 'f#/5', accidental: '#', clef: 'treble' }, { key: 'g/5', clef: 'treble' },
];

export const BASS_POOL: NoteEntry[] = [
  { key: 'c/3', clef: 'bass' }, { key: 'd/3', clef: 'bass' }, { key: 'e/3', clef: 'bass' }, { key: 'f/3', clef: 'bass' },
  { key: 'g/3', clef: 'bass' }, { key: 'a/3', clef: 'bass' }, { key: 'b/3', clef: 'bass' }, { key: 'c/4', clef: 'bass' },
  { key: 'd/4', clef: 'bass' }, { key: 'e/4', clef: 'bass' },
];

export const NOTE_POOL: NoteEntry[] = [...TREBLE_POOL, ...BASS_POOL];

/** All selectable natural notes, low to high. Used by the landing UI and buildNotePool. */
export const ALL_NATURAL_NOTES: string[] = [
  'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3',
  'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4',
  'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5',
];

// Notes that have a sharp (E and B do not)
const HAS_SHARP = new Set(['C', 'D', 'F', 'G', 'A']);

function rangePool(
  from: string,
  to: string,
  clef: 'treble' | 'bass',
  includeAccidentals: boolean,
): NoteEntry[] {
  const fromIdx = ALL_NATURAL_NOTES.indexOf(from);
  const toIdx   = ALL_NATURAL_NOTES.indexOf(to);
  if (fromIdx < 0 || toIdx < 0 || fromIdx > toIdx) return [];

  const pool: NoteEntry[] = [];
  for (let i = fromIdx; i <= toIdx; i++) {
    const label = ALL_NATURAL_NOTES[i];       // 'C4'
    const name  = label[0].toLowerCase();     // 'c'
    const oct   = label.slice(-1);            // '4'
    pool.push({ key: `${name}/${oct}`, clef });
    if (includeAccidentals && HAS_SHARP.has(label[0])) {
      pool.push({ key: `${name}#/${oct}`, accidental: '#', clef });
    }
  }
  return pool;
}

export function buildNotePool(
  hand: 'left' | 'right' | 'both',
  rightFrom: string,
  rightTo: string,
  leftFrom: string,
  leftTo: string,
  includeAccidentals: boolean,
): NoteEntry[] {
  const pool: NoteEntry[] = [];
  if (hand === 'right' || hand === 'both') {
    pool.push(...rangePool(rightFrom, rightTo, 'treble', includeAccidentals));
  }
  if (hand === 'left' || hand === 'both') {
    pool.push(...rangePool(leftFrom, leftTo, 'bass', includeAccidentals));
  }
  return pool.length ? pool : NOTE_POOL;
}
