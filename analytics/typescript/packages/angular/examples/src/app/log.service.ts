import { Injectable } from '@angular/core';

export interface LogEntry {
  time: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class LogService {
  entries: LogEntry[] = [];

  log(message: string, type: LogEntry['type'] = 'info') {
    const time = new Date().toLocaleTimeString();
    this.entries.unshift({ time, message, type });
  }

  clear() {
    this.entries = [];
  }
}
