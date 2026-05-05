import { Injectable, signal } from '@angular/core';
import { PracticeSettings, DEFAULT_SETTINGS } from './practice-settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly settings = signal<PracticeSettings>({ ...DEFAULT_SETTINGS });

  save(s: PracticeSettings): void {
    this.settings.set({ ...s });
  }
}
