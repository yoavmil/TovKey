import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { SheetMusicComponent } from '../sheet-music/sheet-music.component';
import { PianoKeyboardComponent } from '../piano-keyboard/piano-keyboard.component';
import { AudioService } from '../audio/audio.service';
import { SettingsService } from '../settings.service';
import { NoteEntry, NoteState, buildNotePool, vexKeyToLabel } from '../note-utils';

@Component({
  selector: 'app-practice',
  standalone: true,
  imports: [SheetMusicComponent, PianoKeyboardComponent],
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.css',
})
export class PracticeComponent {
  private audio  = inject(AudioService);
  private router = inject(Router);
  private svc    = inject(SettingsService);

  protected notes        = signal<NoteEntry[]>([]);
  protected states       = signal<NoteState[]>([]);
  protected currentIndex = signal(0);
  protected done         = signal(false);
  protected feedback     = signal<'correct' | 'wrong' | null>(null);
  protected isListening  = this.audio.isListening;

  protected targetNote = computed(() => {
    const note = this.notes()[this.currentIndex()];
    return note ? vexKeyToLabel(note.key) : null;
  });

  protected targetClef = computed(() =>
    this.notes()[this.currentIndex()]?.clef ?? null
  );

  constructor() {
    this.audio.noteDetected$
      .pipe(takeUntilDestroyed())
      .subscribe(label => this.checkNote(label));

    this.generateNotes();
  }

  protected generateNotes(): void {
    const s = this.svc.settings();
    const pool = buildNotePool(s.hand, s.rightFrom, s.rightTo, s.leftFrom, s.leftTo, s.includeAccidentals);
    const count = s.notesCount;
    const notes = Array.from({ length: count }, () =>
      pool[Math.floor(Math.random() * pool.length)]
    );
    this.notes.set(notes);
    this.states.set(['active', ...Array<NoteState>(count - 1).fill('pending')]);
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

  protected goBack(): void {
    this.audio.stopListening();
    this.router.navigate(['/']);
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
        this.states.set(s);
        setTimeout(() => this.generateNotes(), 800);
        return;
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
