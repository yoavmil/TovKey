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

  private locked = false;

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

    const pick = (p: NoteEntry[]) => p[Math.floor(Math.random() * p.length)];
    let notes: NoteEntry[];

    const treble = pool.filter(n => n.clef === 'treble');
    const bass   = pool.filter(n => n.clef === 'bass');
    if (s.hand === 'both' && count >= 2 && treble.length && bass.length) {
      // Guarantee at least one note from each clef, then fill the rest randomly
      const seed = [pick(treble), pick(bass)];
      const rest = Array.from({ length: count - 2 }, () => pick(pool));
      notes = [...seed, ...rest].sort(() => Math.random() - 0.5);
    } else {
      notes = Array.from({ length: count }, () => pick(pool));
    }
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
    if (this.done() || this.locked) return;
    const expected = this.targetNote();
    if (!expected) return;

    const s = [...this.states()];
    const idx = this.currentIndex();

    if (detected === expected) {
      this.locked = true;
      s[idx] = 'correct';
      this.feedback.set('correct');
      const next = idx + 1;
      if (next < this.notes().length) {
        s[next] = 'active';
        this.currentIndex.set(next);
        this.states.set(s);
        setTimeout(() => { this.locked = false; }, 800);
        return;
      } else {
        this.done.set(true);
        this.states.set(s);
        setTimeout(() => this.generateNotes(), 800);
        return;
      }
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
