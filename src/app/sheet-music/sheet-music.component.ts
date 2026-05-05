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
    this.cdr.detectChanges();

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
    const count = this.notes.length;

    const hasTreble = this.notes.some(n => n.clef !== 'bass');
    const hasBass   = this.notes.some(n => n.clef === 'bass');

    // Build one tickable per beat for each staff.
    // Where the note belongs to the other staff, insert a GhostNote (invisible spacer).
    const rest = () => {
      const r = new StaveNote({ keys: ['b/4'], duration: '4r' });
      r.setStyle({ fillStyle: '#ccc', strokeStyle: '#ccc' });
      return r;
    };

    const trebleTicks: StaveNote[] = [];
    const bassTicks:   StaveNote[] = [];

    this.notes.forEach((entry, i) => {
      const color = STATE_COLOR[this.states[i] ?? 'pending'];
      const makeNote = () => {
        const n = new StaveNote({ keys: [entry.key], duration: 'q', clef: entry.clef });
        if (entry.accidental) n.addModifier(new Accidental(entry.accidental));
        n.setStyle({ fillStyle: color, strokeStyle: color });
        return n;
      };

      if (entry.clef === 'bass') {
        trebleTicks.push(rest());
        bassTicks.push(makeNote());
      } else {
        trebleTicks.push(makeNote());
        bassTicks.push(rest());
      }
    });

    // Layout
    const staveHeight = 50;
    const gap = 50;
    const totalH = hasTreble && hasBass ? staveHeight * 2 + gap : staveHeight;
    const startY = Math.max(12, (height - totalH) / 2);

    const voices: Voice[] = [];
    let trebleStave: Stave | undefined;
    let trebleVoice: Voice | undefined;
    let bassStave: Stave | undefined;
    let bassVoice: Voice | undefined;

    if (hasTreble) {
      trebleStave = new Stave(staveX, startY, staveWidth);
      trebleStave.addClef('treble').addTimeSignature(`${count}/4`);
      trebleStave.setContext(context).draw();

      trebleVoice = new Voice({ numBeats: count, beatValue: 4 }).setStrict(false);
      trebleVoice.addTickables(trebleTicks);
      voices.push(trebleVoice);
    }

    if (hasBass) {
      const bassY = hasTreble ? startY + staveHeight + gap : startY;
      bassStave = new Stave(staveX, bassY, staveWidth);
      bassStave.addClef('bass').addTimeSignature(`${count}/4`);
      bassStave.setContext(context).draw();

      bassVoice = new Voice({ numBeats: count, beatValue: 4 }).setStrict(false);
      bassVoice.addTickables(bassTicks);
      voices.push(bassVoice);
    }

    // Format all voices together so beat positions align across staves
    new Formatter().joinVoices(voices).format(voices, staveWidth - 100);

    if (trebleVoice && trebleStave) trebleVoice.draw(context, trebleStave);
    if (bassVoice   && bassStave)   bassVoice.draw(context, bassStave);
  }
}
