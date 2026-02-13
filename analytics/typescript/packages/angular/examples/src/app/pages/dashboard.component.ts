import { Component, inject } from '@angular/core';
import { KitbaseAnalyticsService } from '@kitbase/analytics-angular';
import { LogService } from '../log.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="grid">
      <!-- Track Custom Event -->
      <div class="card">
        <h2>Track Custom Event</h2>
        <div class="field-row">
          <label>Channel</label>
          <input #channel value="payments" placeholder="e.g. payments, auth" />
        </div>
        <div class="field-row">
          <label>Event Name</label>
          <input #eventName value="New Subscription" placeholder="e.g. User Signed Up" />
        </div>
        <div class="field-row">
          <label>Tags (JSON)</label>
          <input #tags value='{"plan": "premium", "cycle": "monthly"}' placeholder='{"key": "value"}' />
        </div>
        <button (click)="trackEvent(channel.value, eventName.value, tags.value)">Track Event</button>
      </div>

      <!-- Quick Events -->
      <div class="card">
        <h2>Quick Events</h2>
        <div class="btn-group">
          <button (click)="quickTrack('auth', 'User Signed Up')">User Signed Up</button>
          <button (click)="quickTrack('auth', 'User Logged In')">User Logged In</button>
          <button (click)="quickTrack('payments', 'New Subscription')">New Subscription</button>
          <button (click)="quickTrack('features', 'Feature Used')">Feature Used</button>
        </div>
      </div>

      <!-- Identify User -->
      <div class="card">
        <h2>Identify User</h2>
        <div class="field-row">
          <label>User ID</label>
          <input #userId value="user-123" />
        </div>
        <div class="field-row">
          <label>Email</label>
          <input #email value="test@example.com" />
        </div>
        <button (click)="identify(userId.value, email.value)">Identify</button>
        <button class="secondary" (click)="resetUser()">Reset</button>
        <button class="secondary" (click)="showUserId()">Get User ID</button>
      </div>

      <!-- Super Properties -->
      <div class="card">
        <h2>Super Properties</h2>
        <div class="field-row">
          <label>Properties (JSON)</label>
          <input #superProps value='{"app_version": "2.1.0", "platform": "web"}' />
        </div>
        <div class="btn-group">
          <button (click)="registerProps(superProps.value)">Register</button>
          <button class="secondary" (click)="registerOnce(superProps.value)">Register Once</button>
          <button class="secondary" (click)="getProps()">Get All</button>
          <button class="danger" (click)="clearProps()">Clear All</button>
        </div>
      </div>

      <!-- Time Events -->
      <div class="card">
        <h2>Time Events</h2>
        <div class="field-row">
          <label>Event Name</label>
          <input #timedEvent value="Video Watched" />
        </div>
        <div class="btn-group">
          <button (click)="startTimer(timedEvent.value)">Start Timer</button>
          <button class="secondary" (click)="trackTimed(timedEvent.value)">Track (stops timer)</button>
          <button class="danger" (click)="cancelTimer(timedEvent.value)">Cancel</button>
          <button class="secondary" (click)="listTimers()">List Active</button>
        </div>
      </div>

      <!-- Analytics -->
      <div class="card">
        <h2>Analytics</h2>
        <div class="btn-group">
          <button (click)="trackPageView()">Track Page View</button>
          <button (click)="trackRevenue()">Track Revenue ($19.99)</button>
          <button (click)="trackOutbound()">Track Outbound Link</button>
        </div>

        <h2 style="margin-top: 1.5rem;">Privacy & Consent</h2>
        <div class="btn-group">
          <button class="danger" (click)="optOut()">Opt Out</button>
          <button (click)="optIn()">Opt In</button>
          <button class="secondary" (click)="checkConsent()">Check Status</button>
        </div>

        <h2 style="margin-top: 1.5rem;">Debug</h2>
        <div class="btn-group">
          <button class="secondary" (click)="toggleDebug()">Toggle Debug</button>
        </div>
      </div>

      <!-- Log -->
      <div class="card log-container">
        <h2>Event Log <button class="secondary" (click)="logService.clear()" style="float:right;font-size:0.75rem;">Clear</button></h2>
        <div class="log">
          @for (entry of logService.entries; track entry.time + entry.message) {
            <div class="log-entry">
              <span class="log-time">{{ entry.time }}</span>
              <span [class]="'log-' + entry.type"> {{ entry.message }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  private kitbase = inject(KitbaseAnalyticsService);
  protected logService = inject(LogService);

  async trackEvent(channel: string, event: string, tagsJson: string) {
    try {
      const tags = tagsJson ? JSON.parse(tagsJson) : undefined;
      await this.kitbase.track({ channel, event, tags });
      this.logService.log(`Tracked: [${channel}] ${event}`, 'success');
    } catch (e) {
      this.logService.log(`Error: ${e}`, 'error');
    }
  }

  async quickTrack(channel: string, event: string) {
    try {
      await this.kitbase.track({ channel, event });
      this.logService.log(`Tracked: [${channel}] ${event}`, 'success');
    } catch (e) {
      this.logService.log(`Error: ${e}`, 'error');
    }
  }

  async identify(userId: string, email: string) {
    try {
      await this.kitbase.identify({ userId, traits: { email } });
      this.logService.log(`Identified user: ${userId}`, 'success');
    } catch (e) {
      this.logService.log(`Error: ${e}`, 'error');
    }
  }

  resetUser() {
    this.kitbase.reset();
    this.logService.log('User reset', 'info');
  }

  showUserId() {
    const id = this.kitbase.getUserId();
    this.logService.log(`Current user ID: ${id ?? '(none)'}`, 'info');
  }

  registerProps(json: string) {
    try {
      this.kitbase.register(JSON.parse(json));
      this.logService.log('Super properties registered', 'success');
    } catch (e) {
      this.logService.log(`Error: ${e}`, 'error');
    }
  }

  registerOnce(json: string) {
    try {
      this.kitbase.registerOnce(JSON.parse(json));
      this.logService.log('Super properties registered (once)', 'success');
    } catch (e) {
      this.logService.log(`Error: ${e}`, 'error');
    }
  }

  getProps() {
    const props = this.kitbase.getSuperProperties();
    this.logService.log(`Super properties: ${JSON.stringify(props)}`, 'info');
  }

  clearProps() {
    this.kitbase.clearSuperProperties();
    this.logService.log('Super properties cleared', 'info');
  }

  startTimer(eventName: string) {
    this.kitbase.timeEvent(eventName);
    this.logService.log(`Timer started: ${eventName}`, 'info');
  }

  async trackTimed(eventName: string) {
    const duration = this.kitbase.getEventDuration(eventName);
    try {
      await this.kitbase.track({ channel: 'timed', event: eventName });
      this.logService.log(`Tracked timed event: ${eventName} (${duration ?? 0}ms)`, 'success');
    } catch (e) {
      this.logService.log(`Error: ${e}`, 'error');
    }
  }

  cancelTimer(eventName: string) {
    this.kitbase.cancelTimeEvent(eventName);
    this.logService.log(`Timer cancelled: ${eventName}`, 'info');
  }

  listTimers() {
    const timers = this.kitbase.getTimedEvents();
    this.logService.log(`Active timers: ${timers.length ? timers.join(', ') : '(none)'}`, 'info');
  }

  async trackPageView() {
    try {
      await this.kitbase.trackPageView();
      this.logService.log('Page view tracked', 'success');
    } catch (e) {
      this.logService.log(`Error: ${e}`, 'error');
    }
  }

  async trackRevenue() {
    try {
      await this.kitbase.trackRevenue({ amount: 19.99, currency: 'USD' });
      this.logService.log('Revenue tracked: $19.99 USD', 'success');
    } catch (e) {
      this.logService.log(`Error: ${e}`, 'error');
    }
  }

  async trackOutbound() {
    try {
      await this.kitbase.trackOutboundLink({ url: 'https://example.com', text: 'Example' });
      this.logService.log('Outbound link tracked: https://example.com', 'success');
    } catch (e) {
      this.logService.log(`Error: ${e}`, 'error');
    }
  }

  async optOut() {
    await this.kitbase.optOut();
    this.logService.log('Opted out of tracking', 'info');
  }

  optIn() {
    this.kitbase.optIn();
    this.logService.log('Opted in to tracking', 'info');
  }

  checkConsent() {
    const opted = this.kitbase.isOptedOut();
    const consent = this.kitbase.hasConsent();
    this.logService.log(`Opted out: ${opted}, Has consent: ${consent}`, 'info');
  }

  toggleDebug() {
    const current = this.kitbase.isDebugMode();
    this.kitbase.setDebugMode(!current);
    this.logService.log(`Debug mode: ${!current}`, 'info');
  }
}
