import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SheetMusicComponent } from './sheet-music/sheet-music.component';
import { PianoKeyboardComponent } from './piano-keyboard/piano-keyboard.component';
import { AudioService } from './audio/audio.service';
import { NoteEntry, NoteState, NOTE_POOL, vexKeyToLabel } from './note-utils';

@Component({
  selector: 'app-root',
  imports: [SheetMusicComponent, PianoKeyboardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private audio = inject(AudioService);

  protected notes = signal<NoteEntry[]>([]);
  protected states = signal<NoteState[]>([]);
  protected currentIndex = signal(0);
  protected done = signal(false);
  protected feedback = signal<'correct' | 'wrong' | null>(null);
  protected isListening = this.audio.isListening;

  protected targetNote = computed(() => {
    const note = this.notes()[this.currentIndex()];
    return note ? vexKeyToLabel(note.key) : null;
  });

  constructor() {
    this.audio.noteDetected$
      .pipe(takeUntilDestroyed())
      .subscribe(label => this.checkNote(label));

    this.generateNotes();
  }

  protected generateNotes(): void {
    const notes = Array.from({ length: 4 }, () =>
      NOTE_POOL[Math.floor(Math.random() * NOTE_POOL.length)]
    );
    this.notes.set(notes);
    this.states.set(['active', 'pending', 'pending', 'pending']);
    this.currentIndex.set(0);
    this.done.set(false);
    this.feedback.set(null);
  }

  protected async toggleMic(): Promise<void> {
    if (this.isListening()) {
      this.audio.stopListening();
    } else {
      await this.audio.startListening();
    }
  }

  private checkNote(detected: string): void {
    if (this.done()) return;
    const expected = this.targetNote();
    if (!expected) return;

    const s = [...this.states()];
    const idx = this.currentIndex();

    if (detected === expected) {
      s[idx] = 'correct';
      this.feedback.set('correct');
      const next = idx + 1;
      if (next < this.notes().length) {
        s[next] = 'active';
        this.currentIndex.set(next);
      } else {
        this.done.set(true);
      }
      this.states.set(s);
    } else {
      s[idx] = 'wrong';
      this.states.set(s);
      this.feedback.set('wrong');
      setTimeout(() => {
        const ss = [...this.states()];
        ss[idx] = 'active';
        this.states.set(ss);
        this.feedback.set(null);
      }, 600);
    }
  }
}
