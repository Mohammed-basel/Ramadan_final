import { useEffect, useMemo, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { ProductCard } from './components/ProductCard';
import { PriceChart } from './components/PriceChart';
import { KPICards } from './components/KPICards';
import { sampleProducts } from './data/sampleProducts';
import { loadProductsFromCSV } from './lib/csvLoader';
import { calculatePriceChange, getChangeCategory } from './lib/calc';
import { ProductWithPrices } from './types';
import { detectLangFromUrl, t, Lang } from './lib/i18n';

type FilterType = 'all' | 'increase' | 'decrease' | 'stable';

function App() {
  const lang: Lang = detectLangFromUrl();
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [usingSampleData, setUsingSampleData] = useState(false);

  // If embedded in an iframe, notify parent page with our height (PCBS integration).
  useEffect(() => {
    const sendHeight = () => {
      if (window.self !== window.top) {
        const height = document.documentElement.scrollHeight;
        window.parent.postMessage({ type: 'pcbs-iframe-resize', height }, '*');
      }
    };

    sendHeight();
    window.addEventListener('resize', sendHeight);

    const observer = new MutationObserver(sendHeight);
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });

    return () => {
      window.removeEventListener('resize', sendHeight);
      observer.disconnect();
    };
  }, []);

  const useSampleData = () => {
    setProducts(sampleProducts);
    setSelectedId(sampleProducts[0]?.id ?? null);
    setUsingSampleData(true);

    const maxWeek = Math.max(...sampleProducts.flatMap(p => p.prices.map(pr => pr.week_number)), 1);
    setCurrentWeek(maxWeek);
  };

  async function loadData() {
    setLoading(true);
    try {
      const data = await loadProductsFromCSV(lang);
      if (!data || data.length === 0) throw new Error('No data found in CSV files');

      setProducts(data);
      setSelectedId(String(data[0]?.id ?? '') || null);
      setUsingSampleData(false);

      const maxWeek = Math.max(...data.flatMap(p => p.prices.map(pr => pr.week_number)), 1);
      setCurrentWeek(maxWeek);
    } catch (error) {
      console.error('CSV load failed. Falling back to sample data.', error);
      useSampleData();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const priceChange = calculatePriceChange(product, currentWeek);
      const category = getChangeCategory(priceChange.percent);

      if (filterType === 'increase') return category === 'increase';
      if (filterType === 'decrease') return category === 'decrease';
      if (filterType === 'stable') return category === 'stable';
      return true;
    });
  }, [products, filterType, currentWeek]);

  // IMPORTANT: filter applies to the selected commodity too.
  // If it no longer matches, clear selection (so user understands it's filtered out).
  useEffect(() => {
    if (!selectedId) return;
    const stillThere = filteredProducts.some(p => p.id === selectedId);
    if (!stillThere) setSelectedId(null);
  }, [filterType, currentWeek, filteredProducts, selectedId]);

  const selectedProduct =
    (selectedId ? filteredProducts.find((p) => p.id === selectedId) : null) || filteredProducts[0] || null;

  const allPriceChanges = useMemo(
    () => products.map((p) => calculatePriceChange(p, currentWeek)),
    [products, currentWeek]
  );

  const maxIncrease = useMemo(() => {
    if (allPriceChanges.length === 0) return null;
    return allPriceChanges.reduce((max, item) => (item.percent > max.percent ? item : max), allPriceChanges[0]);
  }, [allPriceChanges]);

  const maxDecrease = useMemo(() => {
    if (allPriceChanges.length === 0) return null;
    return allPriceChanges.reduce((min, item) => (item.percent < min.percent ? item : min), allPriceChanges[0]);
  }, [allPriceChanges]);

  const exportToExcel = () => {
    const headers =
      lang === 'ar'
        ? [
            'المنتج',
            'الأسبوع',
            'السعر الأسبوعي',
            'السعر الإرشادي',
            'التغير عن الإرشادي %',
            'التغير عن الإرشادي (₪)',
            'السعر للأسبوع السابق',
            'نسبة التغيير عن الأسبوع السابق',
            'التغير عن الأسبوع السابق (₪)',
          ]
        : [
            'Commodity',
            'Week',
            'Weekly price',
            'Indicative price',
            'Change vs indicative %',
            'Change vs indicative (₪)',
            'Previous week price',
            '% change vs previous week',
            'Change vs previous week (₪)',
          ];

    const NA = t(lang, 'na');

    const rows = filteredProducts.map((product) => {
      const weekPrice = product.prices.find((p) => p.week_number === currentWeek)?.price;

      const prevPrice =
        currentWeek > 1 ? product.prices.find((p) => p.week_number === currentWeek - 1)?.price : undefined;

      const wp = typeof weekPrice === 'number' ? weekPrice : 0;

      const diffRef = wp - (product.reference_price || 0);
      const pctRef = product.reference_price ? (diffRef / product.reference_price) * 100 : 0;

      const diffPrev = prevPrice == null ? null : wp - prevPrice;
      const pctPrev = prevPrice ? ((wp - prevPrice) / prevPrice) * 100 : null;

      return [
        product.name,
        currentWeek,
        wp.toFixed(2),
        Number(product.reference_price || 0).toFixed(2),
        pctRef.toFixed(1),
        diffRef.toFixed(2),
        prevPrice == null ? NA : Number(prevPrice).toFixed(2),
        prevPrice == null ? NA : Number(pctPrev || 0).toFixed(1),
        prevPrice == null ? NA : Number(diffPrev || 0).toFixed(2),
      ];
    });

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const headerRow = `<tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`;
    const bodyRows = rows
      .map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(String(c))}</td>`).join('')}</tr>`)
      .join('');

    const html =
      `\ufeff` +
      `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>` +
      `<table dir="${dir}" border="1">` +
      `<thead>${headerRow}</thead>` +
      `<tbody>${bodyRows}</tbody>` +
      `</table></body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ramadan_prices_week_${currentWeek}_${lang}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center" dir={dir}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
          <p className="text-xl font-bold text-gray-700">{lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50" dir={dir}>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">{t(lang, 'pageTitle')}</h1>
          <p className="text-gray-700 mt-2">{t(lang, 'pageSubtitle')}</p>
        </header>

        {usingSampleData && (
          <div className="bg-amber-50 border border-amber-300 text-amber-800 rounded-xl p-4 mb-6">
            {lang === 'ar'
              ? 'تم تشغيل بيانات تجريبية (تعذر قراءة ملفات CSV على الخادم).'
              : 'Showing sample data (CSV files were not reachable on the server).'}
            <div className="text-sm mt-2 opacity-90">{t(lang, 'dataFilesNote')}</div>
          </div>
        )}

        <KPICards maxIncrease={maxIncrease} maxDecrease={maxDecrease} currentWeek={currentWeek} products={products} />

        <div className="flex flex-col lg:flex-row gap-6 mt-6">
          {/* Left: products */}
          <div className="lg:w-[420px]">
            <div className="bg-white rounded-2xl shadow p-4 mb-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="font-bold text-gray-800">{t(lang, 'priceChangeFilter')}</span>
                </div>

                <select
                  className="border rounded-lg px-3 py-2 text-sm bg-white"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                >
                  <option value="all">{t(lang, 'filterAll')}</option>
                  <option value="increase">{t(lang, 'filterIncrease')}</option>
                  <option value="decrease">{t(lang, 'filterDecrease')}</option>
                  <option value="stable">{t(lang, 'filterStable')}</option>
                </select>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-800">{t(lang, 'week')}:</span>
                  <select
                    className="border rounded-lg px-3 py-2 text-sm bg-white"
                    value={currentWeek}
                    onChange={(e) => setCurrentWeek(Number(e.target.value))}
                  >
                    {Array.from({ length: 10 }).map((_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        {t(lang, 'week')} {w}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={exportToExcel}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                  title={lang === 'ar' ? 'تنزيل جدول' : 'Download table'}
                >
                  <Download size={16} />
                  {lang === 'ar' ? 'تنزيل جدول' : 'Download table'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isSelected={selectedProduct?.id === product.id}
                  onToggle={() => setSelectedId(product.id)}
                  isHighestIncrease={maxIncrease?.product.id === product.id}
                  isLowestDecrease={maxDecrease?.product.id === product.id}
                  currentWeek={currentWeek}
                />
              ))}
            </div>
          </div>

          {/* Right: selected chart (closer to the selected commodity) */}
          <div className="flex-1">
            {selectedProduct ? (
              <PriceChart products={[selectedProduct]} currentWeek={currentWeek} lang={lang} />
            ) : (
              <div className="bg-white rounded-2xl shadow p-6 text-gray-700">
                {lang === 'ar' ? 'اختر سلعة لعرض الرسم البياني.' : 'Select a commodity to see the chart.'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
