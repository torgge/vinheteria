import { TestBed } from '@angular/core/testing';
import { ExchangeRateService } from './exchange-rate.service';

// O service semeia a partir de DAILY_RATES (~40 dias até hoje). Para isolar a lógica,
// os testes usam datas no ano 2000, fora do alcance da semente.
describe('ExchangeRateService', () => {
  let service: ExchangeRateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ExchangeRateService] });
    service = TestBed.inject(ExchangeRateService);
  });

  describe('getRateForDate', () => {
    it('trata BRL como identidade (sem conversão)', () => {
      const resolved = service.getRateForDate('BRL', '2000-03-10');
      expect(resolved).toEqual({ rate: 1, date: '2000-03-10', source: null, carriedForward: false });
    });

    it('retorna a taxa exata quando existe no dia', () => {
      service.upsertRate('USD', '2000-03-10', 5.3);
      const resolved = service.getRateForDate('USD', '2000-03-10');
      expect(resolved).toMatchObject({ rate: 5.3, date: '2000-03-10', carriedForward: false });
    });

    it('faz carry-forward da última taxa útil anterior quando falta o dia', () => {
      service.upsertRate('USD', '2000-03-10', 5.3);
      // consulta 3 dias depois sem taxa própria → carrega a anterior
      const resolved = service.getRateForDate('USD', '2000-03-13');
      expect(resolved).toMatchObject({ rate: 5.3, date: '2000-03-10', carriedForward: true });
    });

    it('não usa taxa futura para carry-forward', () => {
      service.upsertRate('USD', '2000-03-20', 5.4);
      const resolved = service.getRateForDate('USD', '2000-03-10');
      // só há taxa depois da data pedida → sem base anterior
      expect(resolved).toBeNull();
    });
  });

  describe('toAccounting', () => {
    it('converte para BRL usando a taxa resolvida', () => {
      service.upsertRate('USD', '2000-03-10', 5.3);
      const result = service.toAccounting(22.5, 'USD', '2000-03-10');
      expect(result?.accountingAmount).toBeCloseTo(119.25, 2);
      expect(result?.resolved.carriedForward).toBe(false);
    });

    it('devolve o próprio valor para BRL sem taxa', () => {
      const result = service.toAccounting(100, 'BRL', '2000-03-10');
      expect(result?.accountingAmount).toBe(100);
      expect(result?.resolved.source).toBeNull();
    });

    it('retorna null quando o par nunca teve taxa (bootstrap)', () => {
      // remove qualquer semente do par via consulta a data anterior a tudo
      const result = service.toAccounting(50, 'USD', '1990-01-01');
      expect(result).toBeNull();
    });
  });

  describe('upsertRate', () => {
    it('override manual vence o feed no mesmo par/dia', () => {
      service.upsertRate('USD', '2000-03-10', 5.3);
      service.upsertRate('USD', '2000-03-10', 5.99);
      const resolved = service.getRateForDate('USD', '2000-03-10');
      expect(resolved).toMatchObject({ rate: 5.99, source: 'MANUAL' });
      // não duplica: só uma taxa para o par/dia
      const sameDay = service.rates().filter(r => r.fromCurrency === 'USD' && r.date === '2000-03-10');
      expect(sameDay).toHaveLength(1);
    });

    it('rejeita BRL como origem', () => {
      expect(() => service.upsertRate('BRL', '2000-03-10', 1)).toThrow();
    });

    it('rejeita taxa não positiva', () => {
      expect(() => service.upsertRate('USD', '2000-03-10', 0)).toThrow();
    });
  });
});
