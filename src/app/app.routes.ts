import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { PracticeComponent } from './practice/practice.component';

export const routes: Routes = [
  { path: '',         component: LandingComponent },
  { path: 'practice', component: PracticeComponent },
  { path: '**',       redirectTo: '' },
];
