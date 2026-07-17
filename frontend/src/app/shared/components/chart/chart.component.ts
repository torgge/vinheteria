import { AfterViewInit, Component, ElementRef, OnDestroy, effect, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
  styles: [`:host { display: block; position: relative; }`],
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  type = input.required<ChartType>();
  data = input.required<ChartConfiguration['data']>();
  options = input<ChartConfiguration['options']>({});

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;

  constructor() {
    effect(() => {
      const data = this.data();
      if (this.chart) {
        this.chart.data = this.resolveDatasetColors(data);
        this.chart.update();
      }
    });
  }

  ngAfterViewInit(): void {
    this.chart = new Chart(this.canvas().nativeElement, {
      type: this.type(),
      data: this.resolveDatasetColors(this.data()),
      options: { responsive: true, maintainAspectRatio: false, ...this.options() },
    });
  }

  // Canvas 2D (and therefore Chart.js) cannot resolve CSS custom properties —
  // `fillStyle = 'var(--x)'` silently falls back to black. Resolve any
  // `var(--token)` dataset color against the live DOM before handing it to Chart.js.
  private resolveCssVar(value: string): string {
    const match = value.match(/^var\((--[\w-]+)(?:,\s*(.+))?\)$/);
    if (!match) return value;
    const [, varName, fallback] = match;
    const resolved = getComputedStyle(this.canvas().nativeElement).getPropertyValue(varName).trim();
    return resolved || fallback?.trim() || value;
  }

  private resolveDatasetColors(data: ChartConfiguration['data']): ChartConfiguration['data'] {
    const colorKeys = [
      'backgroundColor', 'borderColor',
      'pointBackgroundColor', 'pointBorderColor',
      'hoverBackgroundColor', 'hoverBorderColor',
    ] as const;

    const datasets = data.datasets.map((dataset) => {
      const resolved: Record<string, unknown> = { ...dataset };
      for (const key of colorKeys) {
        const value = resolved[key];
        if (typeof value === 'string') {
          resolved[key] = this.resolveCssVar(value);
        } else if (Array.isArray(value)) {
          resolved[key] = value.map((v) => (typeof v === 'string' ? this.resolveCssVar(v) : v));
        }
      }
      return resolved;
    });

    return { ...data, datasets } as unknown as ChartConfiguration['data'];
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
