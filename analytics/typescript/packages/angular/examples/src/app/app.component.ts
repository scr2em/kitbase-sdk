import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <h1>Kitbase Analytics <span class="status">Angular 20</span></h1>
    <p class="subtitle">Example app for &#64;kitbase/analytics-angular</p>

    <nav>
      <a routerLink="/">Dashboard</a>
      <a routerLink="/settings">Settings</a>
    </nav>

    <router-outlet />
  `,
})
export class AppComponent {}
