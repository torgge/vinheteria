import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusBadgeComponent } from './status-badge.component';
import { provideTranslocoStub } from '../../../../testing/transloco-testing';

/**
 * Reference spec — a standalone, signals-based presentational component that
 * injects TranslocoService. Patterns established here:
 *  - import the standalone component directly into the testing module
 *  - set signal inputs with `fixture.componentRef.setInput(name, value)`
 *  - stub TranslocoService with `provideTranslocoStub(...)`
 *  - assert both computed state (component instance) and rendered DOM
 */
describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  function setup(translations: Record<string, string> = {}): void {
    TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
      providers: [provideTranslocoStub(translations)],
    });
    fixture = TestBed.createComponent(StatusBadgeComponent);
  }

  it('maps status to the right severity class and icon', () => {
    setup();
    fixture.componentRef.setInput('status', 'APPROVED');
    fixture.detectChanges();

    const badge: HTMLElement = fixture.nativeElement.querySelector('.badge');
    expect(badge.classList).toContain('badge-success');
    expect(fixture.componentInstance.iconName()).toBe('check');
  });

  it('renders the translated label when a translation exists', () => {
    setup({ 'sales.status.APPROVED': 'Aprovado' });
    fixture.componentRef.setInput('status', 'APPROVED');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Aprovado');
  });

  it('falls back to Title Case when the translation is missing', () => {
    setup(); // stub echoes the key → component takes the fallback branch
    fixture.componentRef.setInput('status', 'PENDING_APPROVAL');
    fixture.detectChanges();

    expect(fixture.componentInstance.displayText()).toBe('Pending Approval');
  });

  it('resolves the purchase namespace when context is "purchase"', () => {
    setup({ 'purchases.status.ORDERED': 'Encomendado' });
    fixture.componentRef.setInput('status', 'ORDERED');
    fixture.componentRef.setInput('context', 'purchase');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Encomendado');
  });
});
