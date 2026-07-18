import { TranslocoService } from '@jsverse/transloco';

/**
 * Minimal TranslocoService stub for unit tests.
 *
 * `translate(key, params)` returns the mapped value from `translations`,
 * interpolating `{{param}}` placeholders. When a key is absent it echoes the
 * key back — this matches how the real service behaves for missing keys and
 * lets components exercise their "translation missing" fallback branches.
 *
 * Usage:
 *   TestBed.configureTestingModule({
 *     imports: [MyComponent],
 *     providers: [provideTranslocoStub({ 'sales.status.APPROVED': 'Aprovado' })],
 *   });
 */
export function provideTranslocoStub(translations: Record<string, string> = {}) {
  const translate = (key: string, params?: Record<string, unknown>): string => {
    const value = translations[key];
    if (value == null) {
      return key;
    }
    return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) => String(params?.[name] ?? ''));
  };

  const stub: Partial<TranslocoService> = {
    translate: translate as TranslocoService['translate'],
  };

  return { provide: TranslocoService, useValue: stub };
}
