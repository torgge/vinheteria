import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoneyDisplayComponent } from './money-display.component';
import { CurrencyService } from '../../../core/currency/currency.service';

describe('MoneyDisplayComponent', () => {
  let fixture: ComponentFixture<MoneyDisplayComponent>;
  let currencyService: { formatMoney: jest.Mock };

  function setup(): void {
    currencyService = { formatMoney: jest.fn() };
    TestBed.configureTestingModule({
      imports: [MoneyDisplayComponent],
      providers: [{ provide: CurrencyService, useValue: currencyService }],
    });
    fixture = TestBed.createComponent(MoneyDisplayComponent);
  }

  it('formats the money with its own fixed currency', () => {
    setup();
    currencyService.formatMoney.mockReturnValue('US$ 200.00');

    fixture.componentRef.setInput('money', { amount: 200, currency: 'USD' });
    fixture.detectChanges();

    expect(currencyService.formatMoney).toHaveBeenCalledWith({ amount: 200, currency: 'USD' });
    expect(fixture.componentInstance.formatted()).toBe('US$ 200.00');
    expect(fixture.nativeElement.textContent).toContain('US$ 200.00');
  });

  it('renders BRL money independent of any selected display currency', () => {
    setup();
    currencyService.formatMoney.mockReturnValue('R$ 1.066,00');

    fixture.componentRef.setInput('money', { amount: 1066, currency: 'BRL' });
    fixture.detectChanges();

    expect(currencyService.formatMoney).toHaveBeenCalledWith({ amount: 1066, currency: 'BRL' });
    expect(fixture.nativeElement.textContent).toContain('R$ 1.066,00');
  });

  it('applies the large size class when size is large', () => {
    setup();
    currencyService.formatMoney.mockReturnValue('R$ 10,00');
    fixture.componentRef.setInput('money', { amount: 10, currency: 'BRL' });
    fixture.componentRef.setInput('size', 'large');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement.querySelector('.money');
    expect(el.classList).toContain('large');
  });
});
