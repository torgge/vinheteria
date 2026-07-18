import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NotificationService } from './notification.service';

/**
 * Reference spec — a service that wraps an Angular Material dependency.
 * Pattern: provide a jest-mocked collaborator via `useValue`, inject the
 * service through TestBed, and assert on the mock's call arguments.
 */
describe('NotificationService', () => {
  let service: NotificationService;
  let snackBar: { open: jest.Mock };

  beforeEach(() => {
    snackBar = { open: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });
    service = TestBed.inject(NotificationService);
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('opens the snackbar with a severity-specific panelClass', () => {
    service.add({ severity: 'success', summary: 'Saved' });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Saved',
      undefined,
      expect.objectContaining({ panelClass: 'snackbar-success' }),
    );
  });

  it('joins summary and detail with an em dash when detail is present', () => {
    service.add({ severity: 'error', summary: 'Failed', detail: 'network down' });

    expect(snackBar.open).toHaveBeenCalledWith(
      'Failed — network down',
      undefined,
      expect.objectContaining({ panelClass: 'snackbar-error' }),
    );
  });

  it('defaults duration to 4000ms and honours a custom life', () => {
    service.add({ severity: 'info', summary: 'default' });
    expect(snackBar.open).toHaveBeenLastCalledWith(
      'default',
      undefined,
      expect.objectContaining({ duration: 4000 }),
    );

    service.add({ severity: 'info', summary: 'custom', life: 1500 });
    expect(snackBar.open).toHaveBeenLastCalledWith(
      'custom',
      undefined,
      expect.objectContaining({ duration: 1500 }),
    );
  });

  it('anchors the snackbar top-end', () => {
    service.add({ severity: 'warn', summary: 'heads up' });

    expect(snackBar.open).toHaveBeenCalledWith(
      'heads up',
      undefined,
      expect.objectContaining({ horizontalPosition: 'end', verticalPosition: 'top' }),
    );
  });
});
