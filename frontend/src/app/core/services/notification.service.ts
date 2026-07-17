import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface AppMessage {
  severity: 'success' | 'info' | 'warn' | 'error';
  summary: string;
  detail?: string;
  life?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  add(msg: AppMessage): void {
    const text = msg.detail ? `${msg.summary} — ${msg.detail}` : msg.summary;
    this.snackBar.open(text, undefined, {
      duration: msg.life ?? 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: `snackbar-${msg.severity}`,
    });
  }
}
