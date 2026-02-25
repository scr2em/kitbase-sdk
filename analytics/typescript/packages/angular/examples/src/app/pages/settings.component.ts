import { Component, inject } from '@angular/core';
import { KitbaseAnalyticsService } from '@kitbase/analytics-angular';
import { LogService } from '../log.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="grid">
      <div class="card">
        <h2>Settings Page</h2>
        <p style="color: #8b949e; margin-bottom: 1rem;">
          Navigate between pages to test automatic page view tracking.
          The core SDK intercepts history.pushState/popstate and tracks
          page views automatically.
        </p>
        <button (click)="trackSettingsViewed()">Track Settings Viewed</button>
      </div>

      <div class="card">
        <h2>SDK Info</h2>
        <div style="font-size: 0.85rem; line-height: 1.8;">
          <div>Debug mode: <strong>{{ kitbase.isDebugMode() }}</strong></div>
          <div>User ID: <strong>{{ kitbase.getUserId() ?? '(none)' }}</strong></div>
          <div>Active timers: <strong>{{ kitbase.getTimedEvents().length }}</strong></div>
          <div>Plugins: <strong>{{ kitbase.getPlugins().join(', ') || '(none)' }}</strong></div>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent {
  protected kitbase = inject(KitbaseAnalyticsService);
  private logService = inject(LogService);

  async trackSettingsViewed() {
    try {
      await this.kitbase.track({ channel: 'navigation', event: 'Settings Viewed' });
      this.logService.log('Tracked: Settings Viewed', 'success');
    } catch (e) {
      this.logService.log(`Error: ${e}`, 'error');
    }
  }
}
