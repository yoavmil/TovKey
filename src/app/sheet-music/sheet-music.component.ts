import {
  Component, ElementRef, ViewChild, Input, OnInit, OnChanges, OnDestroy,
  SimpleChanges, ChangeDetectorRef, inject, signal,
} from '@angular/core';
import { Font, Renderer, Stave, StaveNote, Voice, Formatter, Accidental } from 'vexflow';
import { NoteEntry, NoteState } from '../note-utils';

const STATE_COLOR: Record<NoteState, string> = {
  pending: '#bbb',
  active:  '#1565c0',
  correct: '#2e7d32',
  wrong:   '#c62828',
};

@Component({
  selector: 'app-sheet-music',
  standalone: true,
  template: `
    @if (fontsReady()) {
      <div #container class="score"></div>
    } @else {
      <p class="loading">Loading…</p>
    }
  `,
  styles: [`
    :host {
      display: flex;
      width: 100%;
      height: 100%;
      align-items: center;
      justify-content: center;
    }
    .score { width: 100%; height: 100%; }
    .loading { color: #888; font-size: 0.85rem; margin: 0; }
  `],
})
export class SheetMusicComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('container') private container?: ElementRef<HTMLDivElement>;
  @Input() notes: NoteEntry[] = [];
  @Input() states: NoteState[] = [];

  private cdr = inject(ChangeDetectorRef);
  private ro?: ResizeObserver;
  protected fontsReady = signal(false);

  async ngOnInit(): Promise<void> {
    await Promise.all([Font.load('Bravura'), Font.load('Academico')]);
    this.fontsReady.set(true);
    this.cdr.detectChanges(); // stamps #container into the DOM

    // ResizeObserver drives all renders — fires immediately on first observe
    // and again on any layout change (orientation flip, window resize, etc.)
    this.ro = new ResizeObserver(() => this.redraw());
    this.ro.observe(this.container!.nativeElement);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.fontsReady() || !this.container?.nativeElement) return;
    if (changes['notes'] || changes['states']) this.redraw();
  }

  ngOnDestroy(): void {
    this.ro?.disconnect();
  }

  private redraw(): void {
    const el = this.container?.nativeElement;
    if (!el || !this.notes.length) return;

    const { width, height } = el.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    el.innerHTML = '';

    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();
    context.setFont('Arial', 10);

    const staveX = 10;
    const staveWidth = width - 20;
    // Centre the stave vertically; clamp so notes above/below don't clip
    const staveY = Math.max(12, (height - 50) / 2);

    const stave = new Stave(staveX, staveY, staveWidth);
    stave.addClef('treble').addTimeSignature('4/4');
    stave.setContext(context).draw();

    const staveNotes = this.notes.map((entry, i) => {
      const note = new StaveNote({ keys: [entry.key], duration: 'q' });
      if (entry.accidental) note.addModifier(new Accidental(entry.accidental));
      const color = STATE_COLOR[this.states[i] ?? 'pending'];
      note.setStyle({ fillStyle: color, strokeStyle: color });
      return note;
    });

    const voice = new Voice({ numBeats: 4, beatValue: 4 });
    voice.setStrict(false);
    voice.addTickables(staveNotes);
    // ~100 px reserved for clef + time signature on the left
    new Formatter().joinVoices([voice]).format([voice], staveWidth - 100);
    voice.draw(context, stave);
  }
}
