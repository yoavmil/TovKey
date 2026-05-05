export interface PracticeSettings {
  hand: 'left' | 'right' | 'both';
  rightFrom: string;  // e.g. 'C4'
  rightTo:   string;  // e.g. 'B5'
  leftFrom:  string;  // e.g. 'C3'
  leftTo:    string;  // e.g. 'B4'
  notesCount: number;
  includeAccidentals: boolean;
}

export const DEFAULT_SETTINGS: PracticeSettings = {
  hand:      'right',
  rightFrom: 'C4',
  rightTo:   'C5',
  leftFrom:  'C3',
  leftTo:    'C4',
  notesCount: 4,
  includeAccidentals: false,
};
