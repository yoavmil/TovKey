import { Component, inject, HostListener } from '@angular/core';
import { GameService, FallingNote, PIANO_KEYS } from './game.service';
import { PianoKeyboardComponent } from './piano-keyboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PianoKeyboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly gameService = inject(GameService);

  /** Map MIDI note numbers to keyboard keys */
  private readonly keyMap: Record<string, number> = {
    'a': 60,  // C4
    'w': 61,  // C#4
    's': 62,  // D4
    'e': 63,  // D#4
    'd': 64,  // E4
    'f': 65,  // F4
    't': 66,  // F#4
    'g': 67,  // G4
    'y': 68,  // G#4
    'h': 69,  // A4
    'u': 70,  // A#4
    'j': 71,  // B4
    'k': 72,  // C5
  };

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (key === ' ') {
      event.preventDefault();
      if (!this.gameService.isPlaying()) {
        this.gameService.startGame();
      }
      return;
    }

    const midiNumber = this.keyMap[key];
    if (midiNumber !== undefined) {
      event.preventDefault();
      this.gameService.pressKey(midiNumber);
    }
  }

  /** Get the note name for display (e.g., "C4", "D4") */
  getNoteName(note: FallingNote['note']): string {
    return note.name;
  }

  /** Get the note letter for the staff display */
  getNoteLetter(note: FallingNote['note']): string {
    return note.letter;
  }

  /** Get the vertical position on the staff based on note letter */
  getStaffPosition(note: FallingNote['note']): number {
    const positions: Record<string, number> = {
      'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6
    };
    return (positions[note.letter] ?? 0);
  }

  startGame(): void {
    this.gameService.startGame();
  }
}
