import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsService } from '../settings.service';
import { PracticeSettings, DEFAULT_SETTINGS } from '../practice-settings';
import { ALL_NATURAL_NOTES } from '../note-utils';

@Component({
  selector: 'app-landing',
  standalone: true,
  template: `
    <div class="page">
      <header>
        <h1>KeyTov</h1>
        <p class="subtitle">Piano Practice</p>
      </header>

      <div class="card">

        <!-- Hand -->
        <div class="row">
          <span class="label">Hand</span>
          <div class="btn-group">
            <button [class.sel]="hand() === 'left'"  (click)="setHand('left')">Left</button>
            <button [class.sel]="hand() === 'both'"  (click)="setHand('both')">Both</button>
            <button [class.sel]="hand() === 'right'" (click)="setHand('right')">Right</button>
          </div>
        </div>

        <!-- Left hand range -->
        <div class="row" [class.inactive]="hand() === 'right'">
          <span class="label">Left hand</span>
          <div class="range-group">
            <input #lfl type="text" placeholder="C3"
                   [value]="leftFrom()"
                   [disabled]="hand() === 'right'"
                   (input)="lfl.classList.toggle('bad', !valid(lfl.value))"
                   (blur)="handleLeftFrom(lfl)"
                   (keydown.enter)="lfl.blur()" />
            <span class="sep">to</span>
            <input #ltl type="text" placeholder="B4"
                   [value]="leftTo()"
                   [disabled]="hand() === 'right'"
                   (input)="ltl.classList.toggle('bad', !valid(ltl.value))"
                   (blur)="handleLeftTo(ltl)"
                   (keydown.enter)="ltl.blur()" />
          </div>
        </div>

        <!-- Right hand range -->
        <div class="row" [class.inactive]="hand() === 'left'">
          <span class="label">Right hand</span>
          <div class="range-group">
            <input #rfl type="text" placeholder="C4"
                   [value]="rightFrom()"
                   [disabled]="hand() === 'left'"
                   (input)="rfl.classList.toggle('bad', !valid(rfl.value))"
                   (blur)="handleRightFrom(rfl)"
                   (keydown.enter)="rfl.blur()" />
            <span class="sep">to</span>
            <input #rtl type="text" placeholder="B5"
                   [value]="rightTo()"
                   [disabled]="hand() === 'left'"
                   (input)="rtl.classList.toggle('bad', !valid(rtl.value))"
                   (blur)="handleRightTo(rtl)"
                   (keydown.enter)="rtl.blur()" />
          </div>
        </div>

        <!-- Notes per round -->
        <div class="row">
          <span class="label">Notes</span>
          <div class="btn-group">
            @for (n of counts; track n) {
              <button [class.sel]="notesCount() === n" (click)="notesCount.set(n)">{{ n }}</button>
            }
          </div>
        </div>

        <!-- Accidentals -->
        <div class="row">
          <span class="label">Sharps &amp; Flats</span>
          <div class="btn-group">
            <button [class.sel]="!accidentals()" (click)="accidentals.set(false)">Off</button>
            <button [class.sel]="accidentals()"  (click)="accidentals.set(true)">On</button>
          </div>
        </div>

      </div>

      <button class="start-btn" (click)="start()">Start Practicing</button>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      min-height: 100dvh;
      width: 100dvw;
      align-items: center;
      justify-content: center;
      background: #f9f6f0;
      font-family: system-ui, sans-serif;
      overflow: auto;
    }

    .page {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 1.2rem 1rem;
      width: 100%;
      max-width: 460px;
    }

    /* ── Header ─────────────────────────────────────────── */
    header { text-align: center; }

    h1 {
      font-size: 1.8rem;
      font-weight: 800;
      color: #1a0f02;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .subtitle {
      margin: 0.1rem 0 0;
      font-size: 0.72rem;
      color: #999;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    /* ── Card ───────────────────────────────────────────── */
    .card {
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.09);
      padding: 0.85rem 1.1rem;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: opacity 0.15s;
    }

    .row.inactive {
      opacity: 0.35;
      pointer-events: none;
    }

    .label {
      width: 90px;
      font-size: 0.78rem;
      font-weight: 600;
      color: #555;
      flex-shrink: 0;
    }

    /* ── Button group ───────────────────────────────────── */
    .btn-group {
      display: flex;
      gap: 0.35rem;
      flex-wrap: wrap;
    }

    .btn-group button {
      padding: 0.27rem 0.65rem;
      border-radius: 20px;
      border: 2px solid #ddd;
      background: #f5f5f5;
      font-size: 0.8rem;
      cursor: pointer;
      transition: background 0.12s, border-color 0.12s, color 0.12s;
      white-space: nowrap;
    }

    .btn-group button.sel {
      background: #1565c0;
      border-color: #1565c0;
      color: #fff;
    }

    .btn-group button:hover:not(.sel) {
      border-color: #aaa;
      background: #eaeaea;
    }

    /* ── Note text inputs ───────────────────────────────── */
    .range-group {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .range-group input {
      width: 44px;
      padding: 0.27rem 0.4rem;
      border: 2px solid #ddd;
      border-radius: 8px;
      font-size: 0.85rem;
      font-family: inherit;
      text-align: center;
      background: #fff;
      color: #333;
      transition: border-color 0.12s;
    }

    .range-group input:focus {
      outline: none;
      border-color: #1565c0;
    }

    .range-group input.bad {
      border-color: #c62828;
      color: #c62828;
    }

    .range-group input:disabled {
      background: #f5f5f5;
      color: #aaa;
    }

    .sep { font-size: 0.75rem; color: #aaa; }

    /* ── Start button ───────────────────────────────────── */
    .start-btn {
      padding: 0.65rem 2.2rem;
      border-radius: 30px;
      border: none;
      background: #1565c0;
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 3px 10px rgba(21, 101, 192, 0.35);
      transition: background 0.15s, transform 0.1s;
      letter-spacing: 0.02em;
    }

    .start-btn:hover  { background: #0d47a1; }
    .start-btn:active { transform: scale(0.97); }
  `],
})
export class LandingComponent {
  private router = inject(Router);
  private svc    = inject(SettingsService);

  private init = this.svc.settings();

  protected hand        = signal(this.init.hand);
  protected rightFrom   = signal(this.init.rightFrom);
  protected rightTo     = signal(this.init.rightTo);
  protected leftFrom    = signal(this.init.leftFrom);
  protected leftTo      = signal(this.init.leftTo);
  protected notesCount  = signal(this.init.notesCount);
  protected accidentals = signal(this.init.includeAccidentals);

  protected readonly counts = [1, 2, 3, 4, 5, 6];

  protected valid(raw: string): boolean {
    return ALL_NATURAL_NOTES.includes(raw.trim().toUpperCase());
  }

  protected setHand(h: 'left' | 'right' | 'both'): void {
    this.hand.set(h);
    this.rightFrom.set(DEFAULT_SETTINGS.rightFrom);
    this.rightTo.set(DEFAULT_SETTINGS.rightTo);
    this.leftFrom.set(DEFAULT_SETTINGS.leftFrom);
    this.leftTo.set(DEFAULT_SETTINGS.leftTo);
  }

  protected handleRightFrom(el: HTMLInputElement): void {
    const note = this.normalize(el.value);
    if (note) {
      this.rightFrom.set(note);
      if (this.idx(note) > this.idx(this.rightTo())) this.rightTo.set(note);
    }
    el.value = this.rightFrom();
    el.classList.remove('bad');
  }

  protected handleRightTo(el: HTMLInputElement): void {
    const note = this.normalize(el.value);
    if (note) {
      this.rightTo.set(note);
      if (this.idx(note) < this.idx(this.rightFrom())) this.rightFrom.set(note);
    }
    el.value = this.rightTo();
    el.classList.remove('bad');
  }

  protected handleLeftFrom(el: HTMLInputElement): void {
    const note = this.normalize(el.value);
    if (note) {
      this.leftFrom.set(note);
      if (this.idx(note) > this.idx(this.leftTo())) this.leftTo.set(note);
    }
    el.value = this.leftFrom();
    el.classList.remove('bad');
  }

  protected handleLeftTo(el: HTMLInputElement): void {
    const note = this.normalize(el.value);
    if (note) {
      this.leftTo.set(note);
      if (this.idx(note) < this.idx(this.leftFrom())) this.leftFrom.set(note);
    }
    el.value = this.leftTo();
    el.classList.remove('bad');
  }

  protected start(): void {
    const s: PracticeSettings = {
      hand:               this.hand(),
      rightFrom:          this.rightFrom(),
      rightTo:            this.rightTo(),
      leftFrom:           this.leftFrom(),
      leftTo:             this.leftTo(),
      notesCount:         this.notesCount(),
      includeAccidentals: this.accidentals(),
    };
    this.svc.save(s);
    this.router.navigate(['/practice']);
  }

  private normalize(raw: string): string | null {
    const upper = raw.trim().toUpperCase();
    return ALL_NATURAL_NOTES.includes(upper) ? upper : null;
  }

  private idx(note: string): number {
    return ALL_NATURAL_NOTES.indexOf(note);
  }
}
