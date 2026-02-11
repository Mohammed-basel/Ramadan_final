import React, { useMemo, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend,
  ChartOptions,
  Plugin,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { Download } from 'lucide-react';
import { ProductWithPrices } from '../types';
import { Lang, t } from '../lib/i18n';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

type ViewMode = 'all' | 'price' | 'change';

interface PriceChartProps {
  products: ProductWithPrices[];
  currentWeek?: number;
  lang: Lang;
}

function formatWeekLabel(weekNumber: number, weekDate: string | undefined, lang: Lang) {
  const w = lang === 'en' ? `${t(lang, 'week')} ${weekNumber}` : `${t(lang, 'week')} ${weekNumber}`;
  if (!weekDate) return w;
  return `${w} (${weekDate})`;
}

// White canvas background (useful when exporting the chart as an image).
const whiteBackgroundPlugin: Plugin<'bar'> = {
  id: 'whiteBackground',
  beforeDraw: (chart) => {
    const ctx = chart.canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

export function PriceChart({ products, currentWeek = 1, lang }: PriceChartProps) {
  const product = products[0];
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const chartRef = useRef<any>(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const legendFontSize = isMobile ? 11 : 14;
  const tickFontSize = isMobile ? 10 : 14;

  const titleText = t(lang, 'chartTitle');
  const barLabel = t(lang, 'weeklyPrice');
  const lineLabel = t(lang, 'changeVsIndicative');
  const refLabel = t(lang, 'indicativePrice');

  const { labels, weeklyPrices, pctVsRef, ref } = useMemo(() => {
    if (!product) {
      return { labels: [], weeklyPrices: [], pctVsRef: [], ref: 0 };
    }

    const sorted = [...product.prices]
      .sort((a, b) => a.week_number - b.week_number)
      // IMPORTANT: when selecting week N, the chart shows ONLY up to week N (week 1 => only week 1)
      .filter((p) => p.week_number <= currentWeek);

    const lbls = sorted.map((p) => formatWeekLabel(p.week_number, p.week_date, lang));
    const prices = sorted.map((p) => Number(p.price) || 0);
    const refPrice = Number(product.reference_price) || 0;
    const pct = prices.map((p) => (refPrice ? +(((p - refPrice) / refPrice) * 100).toFixed(2) : 0));

    return { labels: lbls, weeklyPrices: prices, pctVsRef: pct, ref: refPrice };
  }, [product, currentWeek, lang]);

  if (!product) return null;

  const datasets: any[] = [];

  const showPrice = viewMode === 'all' || viewMode === 'price';
  const showChange = viewMode === 'all' || viewMode === 'change';

  if (showPrice) {
    datasets.push({
      label: barLabel,
      type: 'bar' as const,
      data: weeklyPrices,
      backgroundColor: 'rgba(0,86,179,0.7)',
      borderColor: 'rgba(0,86,179,1)',
      borderWidth: 1,
      borderRadius: 4,
      yAxisID: 'yBar',
    });
  }

  if (showChange) {
    datasets.push({
      label: lineLabel,
      type: 'line' as const,
      data: pctVsRef,
      borderColor: '#0056b3',
      backgroundColor: 'rgba(0,86,179,0.15)',
      borderWidth: 3,
      pointRadius: 4,
      pointBackgroundColor: '#0056b3',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      tension: 0.3,
      fill: false,
      yAxisID: 'yLine',
    });
  }

  if (showPrice) {
    datasets.push({
      label: refLabel,
      type: 'line' as const,
      data: labels.map(() => ref),
      borderColor: '#dc2626',
      borderWidth: 2,
      borderDash: [8, 4],
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0,
      fill: false,
      yAxisID: 'yBar',
    });
  }

  const data = { labels, datasets };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    barPercentage: 0.4,
    categoryPercentage: 0.6,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          font: { size: legendFontSize, weight: 'bold' as const },
          padding: isMobile ? 10 : 18,
        },
      },
      tooltip: {
        rtl: lang === 'ar',
        titleFont: { size: isMobile ? 12 : 14 },
        bodyFont: { size: isMobile ? 11 : 13 },
        padding: 10,
      },
      title: {
        display: true,
        text: titleText,
        font: { size: isMobile ? 12 : 16, weight: 'bold' as const },
        padding: { top: 6, bottom: 10 },
      },
    },
    scales: {
      x: {
        ticks: { font: { size: tickFontSize } },
      },
      yBar: {
        type: 'linear',
        position: 'left',
        ticks: { font: { size: tickFontSize } },
      },
      yLine: {
        type: 'linear',
        position: 'right',
        grid: { drawOnChartArea: false },
        ticks: { font: { size: tickFontSize } },
      },
    },
  };

  const handleDownload = () => {
    const chart = chartRef.current;
    if (!chart) return;
    const url = chart.toBase64Image('image/png', 1);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chart_${product.id}_week${currentWeek}.png`;
    a.click();
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 h-[420px] sm:h-[520px]">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <button
            className={`px-3 py-1 rounded-full text-sm border ${viewMode === 'all' ? 'bg-blue-600 text-white' : 'bg-white'}`}
            onClick={() => setViewMode('all')}
          >
            {t(lang, 'all')}
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm border ${viewMode === 'price' ? 'bg-blue-600 text-white' : 'bg-white'}`}
            onClick={() => setViewMode('price')}
          >
            {t(lang, 'price')}
          </button>
          <button
            className={`px-3 py-1 rounded-full text-sm border ${viewMode === 'change' ? 'bg-blue-600 text-white' : 'bg-white'}`}
            onClick={() => setViewMode('change')}
          >
            {t(lang, 'change')}
          </button>
        </div>

        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
          title={t(lang, 'downloadChart')}
        >
          <Download size={16} />
          {t(lang, 'downloadChart')}
        </button>
      </div>

      <div className="relative w-full h-[340px] sm:h-[430px]">
        <Chart
          ref={chartRef}
          type="bar"
          data={data}
          options={options}
          plugins={[whiteBackgroundPlugin]}
        />
      </div>
    </div>
  );
}
