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
        this.chart.data = data;
        this.chart.update();
      }
    });
  }

  ngAfterViewInit(): void {
    this.chart = new Chart(this.canvas().nativeElement, {
      type: this.type(),
      data: this.data(),
      options: { responsive: true, maintainAspectRatio: false, ...this.options() },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
