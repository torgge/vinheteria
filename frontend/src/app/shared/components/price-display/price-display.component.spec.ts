import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { PriceDisplayComponent } from './price-display.component';
import { CurrencyService } from '../../../core/currency/currency.service';
import { SupportedCurrency } from '../../../core/currency/currency.model';

describe('PriceDisplayComponent', () => {
  let fixture: ComponentFixture<PriceDisplayComponent>;
  let currencyService: {
    selectedCurrency: jest.Mock;
    formatPrice: jest.Mock;
  };

  function setup(): void {
    currencyService = {
      selectedCurrency: jest.fn().mockReturnValue('BRL'),
      formatPrice: jest.fn(),
    };

    TestBed.configureTestingModule({
      imports: [PriceDisplayComponent],
      providers: [{ provide: CurrencyService, useValue: currencyService }],
    });
    fixture = TestBed.createComponent(PriceDisplayComponent);
  }

  describe('formattedPrice', () => {
    it('delegates to formatPrice when input is a number', () => {
      setup();
      currencyService.formatPrice.mockReturnValue('R$ 42,00');

      fixture.componentRef.setInput('price', 42);
      fixture.detectChanges();

      expect(currencyService.formatPrice).toHaveBeenCalledWith(42);
      expect(fixture.componentInstance.formattedPrice()).toBe('R$ 42,00');
    });

    it('picks the selected currency price and delegates when input is a price object', () => {
      setup();
      currencyService.selectedCurrency.mockReturnValue('USD');
      currencyService.formatPrice.mockReturnValue('US$ 18.75');

      fixture.componentRef.setInput('price', { BRL: 100, PYG: 149250, USD: 18.75 });
      fixture.detectChanges();

      expect(currencyService.formatPrice).toHaveBeenCalledWith(18.75);
      expect(fixture.componentInstance.formattedPrice()).toBe('US$ 18.75');
    });

    it('updates when the price input changes', () => {
      setup();
      currencyService.formatPrice.mockReturnValue('R$ 250,00');

      fixture.componentRef.setInput('price', 250);
      fixture.detectChanges();

      expect(currencyService.formatPrice).toHaveBeenCalledWith(250);

      currencyService.formatPrice.mockReturnValue('R$ 500,00');
      fixture.componentRef.setInput('price', 500);
      fixture.detectChanges();

      expect(currencyService.formatPrice).toHaveBeenCalledWith(500);
      expect(fixture.componentInstance.formattedPrice()).toBe('R$ 500,00');
    });
  });

  describe('DOM rendering', () => {
    it('renders the formatted price in the DOM', () => {
      setup();
      currencyService.formatPrice.mockReturnValue('R$ 99,90');

      fixture.componentRef.setInput('price', 99.9);
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('R$ 99,90');
    });

    it('applies the large size class when size is large', () => {
      setup();
      currencyService.formatPrice.mockReturnValue('R$ 1.000,00');
      fixture.componentRef.setInput('price', { BRL: 1000, PYG: 1492500, USD: 187.5 });
      fixture.componentRef.setInput('size', 'large');
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement.querySelector('.price');
      expect(el.classList).toContain('large');
    });

    it('applies no size class when size is medium (default)', () => {
      setup();
      currencyService.formatPrice.mockReturnValue('R$ 50,00');
      fixture.componentRef.setInput('price', 50);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement.querySelector('.price');
      expect(el.classList).not.toContain('large');
      expect(el.classList).not.toContain('small');
    });
  });
});
