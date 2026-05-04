import { Component, Input, inject } from '@angular/core';
import { AudioService } from '../audio/audio.service';

const TOTAL_WHITE = 21;

const BLACK_KEY_DEFS = [
  { afterIdx: 0, name: 'C#' },
  { afterIdx: 1, name: 'D#' },
  { afterIdx: 3, name: 'F#' },
  { afterIdx: 4, name: 'G#' },
  { afterIdx: 5, name: 'A#' },
];

function buildKeys() {
  const whiteKeys: { label: string }[] = [];
  const blackKeys: { label: string; leftPercent: number }[] = [];

  for (let octave = 3; octave <= 5; octave++) {
    const octaveOffset = (octave - 3) * 7;
    for (const name of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
      whiteKeys.push({ label: `${name}${octave}` });
    }
    for (const def of BLACK_KEY_DEFS) {
      blackKeys.push({
        label: `${def.name}${octave}`,
        leftPercent: ((octaveOffset + def.afterIdx + 1) / TOTAL_WHITE) * 100,
      });
    }
  }
  return { whiteKeys, blackKeys };
}

const { whiteKeys, blackKeys } = buildKeys();

@Component({
  selector: 'app-piano-keyboard',
  standalone: true,
  template: `
    <div class="frame">
      <div class="keyboard">
        @for (key of whiteKeys; track key.label) {
          <div class="white-key"
               [class.target]="key.label === targetNote"
               (click)="onKeyClick(key.label)">
          </div>
        }
        @for (key of blackKeys; track key.label) {
          <div class="black-key"
               [class.target]="key.label === targetNote"
               [style.left]="key.leftPercent + '%'"
               (click)="onKeyClick(key.label, $event)">
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }

    .frame {
      width: 100%;
      height: 100%;
      background: #1e0f02;
      border-top: 4px solid #0d0702;
      padding: 6px 6px 0;
      box-sizing: border-box;
    }

    .keyboard {
      position: relative;
      display: flex;
      width: 100%;
      height: 100%;
    }

    .white-key {
      flex: 1;
      background: linear-gradient(to bottom, #f5f2ec 0%, #fff 20%, #ede8df 100%);
      border: 1px solid #bbb;
      border-top: none;
      border-radius: 0 0 6px 6px;
      box-shadow: inset -1px 0 0 rgba(0,0,0,0.06), 1px 3px 6px rgba(0,0,0,0.25);
      box-sizing: border-box;
      touch-action: manipulation;
      cursor: pointer;
      transition: background 0.05s;
    }

    .white-key:active {
      background: linear-gradient(to bottom, #ddd8ce 0%, #e8e3da 100%);
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);
    }

    .white-key.target {
      background: linear-gradient(to bottom, #bbdefb 0%, #90caf9 50%, #bbdefb 100%);
    }

    .black-key {
      position: absolute;
      top: 0;
      width: calc(100% / 21 * 0.62);
      height: 60%;
      background: linear-gradient(160deg, #3a3a3a 0%, #111 55%, #2a2a2a 100%);
      border-radius: 0 0 5px 5px;
      transform: translateX(-50%);
      z-index: 2;
      box-shadow: 2px 5px 10px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12);
      touch-action: manipulation;
      cursor: pointer;
      transition: background 0.05s;
    }

    .black-key:active {
      background: linear-gradient(160deg, #555 0%, #333 100%);
      box-shadow: 1px 3px 5px rgba(0,0,0,0.5);
    }

    .black-key.target {
      background: linear-gradient(160deg, #1976d2 0%, #0d47a1 100%);
      box-shadow: 2px 5px 10px rgba(0,0,0,0.65), 0 0 8px rgba(25,118,210,0.6);
    }
  `],
})
export class PianoKeyboardComponent {
  /** The note label (e.g. 'C4', 'F#5') the user is expected to play next. */
  @Input() targetNote: string | null = null;

  private audio = inject(AudioService);
  readonly whiteKeys = whiteKeys;
  readonly blackKeys = blackKeys;

  onKeyClick(label: string, event?: MouseEvent): void {
    event?.stopPropagation();
    this.audio.playNote(label);
  }
}
