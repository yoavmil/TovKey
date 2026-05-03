import { Component, inject } from '@angular/core';
import { GameService, PIANO_KEYS } from './game.service';

@Component({
  selector: 'app-piano-keyboard',
  standalone: true,
  template: `
    <div class="piano-container">
      <div class="piano">
        @for (key of gameService.keyStates(); track key.note.midiNumber) {
          @if (key.note.isAccidental) {
            <button
              class="key black"
              [class.correct]="key.state === 'correct'"
              [class.wrong]="key.state === 'wrong'"
              [class.highlight]="key.state === 'highlight'"
              (mousedown)="onKeyPress(key.note.midiNumber)"
              (contextmenu)="$event.preventDefault()"
            >
              <span class="key-label">{{ key.note.name }}</span>
            </button>
          } @else {
            <button
              class="key white"
              [class.correct]="key.state === 'correct'"
              [class.wrong]="key.state === 'wrong'"
              [class.highlight]="key.state === 'highlight'"
              (mousedown)="onKeyPress(key.note.midiNumber)"
              (contextmenu)="$event.preventDefault()"
            >
              <span class="key-label">{{ key.note.letter }}</span>
            </button>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .piano-container {
      width: 100%;
      overflow-x: auto;
      padding: 10px 0;
      background: #111;
    }

    .piano {
      display: flex;
      position: relative;
      height: 180px;
      margin: 0 auto;
      width: fit-content;
      padding: 0 4px;
    }

    .key {
      border: 1px solid #333;
      cursor: pointer;
      transition: background-color 0.1s, transform 0.05s;
      position: relative;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
    }

    .key:active {
      transform: scaleY(0.98);
    }

    .key.white {
      background: #f5f5f5;
      color: #333;
      width: 52px;
      height: 180px;
      border-radius: 0 0 6px 6px;
      border-right: 1px solid #ccc;
      z-index: 1;
    }

    .key.white.correct {
      background: #4caf50 !important;
      color: white;
    }

    .key.white.wrong {
      background: #f44336 !important;
      color: white;
    }

    .key.white.highlight {
      background: #ffeb3b !important;
      color: #333;
    }

    .key.black {
      background: #222;
      color: #ccc;
      width: 34px;
      height: 110px;
      border-radius: 0 0 4px 4px;
      z-index: 2;
      margin-left: -17px;
      margin-right: -17px;
    }

    .key.black.correct {
      background: #2e7d32 !important;
      color: white;
    }

    .key.black.wrong {
      background: #c62828 !important;
      color: white;
    }

    .key.black.highlight {
      background: #f9a825 !important;
      color: #333;
    }

    .key-label {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      font-weight: 600;
      pointer-events: none;
    }

    .key.black .key-label {
      bottom: 6px;
      font-size: 9px;
    }
  `]
})
export class PianoKeyboardComponent {
  protected readonly gameService = inject(GameService);

  onKeyPress(midiNumber: number): void {
    this.gameService.pressKey(midiNumber);
  }
}
