import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { SettingsComponent } from './pages/settings.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'settings', component: SettingsComponent },
];
