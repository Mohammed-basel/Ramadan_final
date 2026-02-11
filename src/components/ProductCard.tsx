import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { ProductWithPrices } from '../types';

interface ProductCardProps {
  product: ProductWithPrices;
  isSelected: boolean;
  onToggle: () => void;
  isHighestIncrease?: boolean;
  isLowestDecrease?: boolean;
  currentWeek: number;
}

function getFallbackIcon(name: string): string {
  const n = (name || '').toLowerCase();

  if (n.includes('دجاج') || n.includes('chicken')) return 'fa-drumstick-bite';
  if (n.includes('خروف') || n.includes('sheep') || n.includes('lamb')) return 'fa-sheep';
  if (n.includes('عجل') || n.includes('beef') || n.includes('cow')) return 'fa-cow';
  if (n.includes('بيض') || n.includes('egg')) return 'fa-egg';
  if (n.includes('جبن') || n.includes('cheese')) return 'fa-cheese';
  if (n.includes('زيت') || n.includes('oil')) return 'fa-oil-can';
  if (n.includes('سكر') || n.includes('sugar')) return 'fa-cubes';
  if (n.includes('أرز') || n.includes('rice')) return 'fa-bowl-rice';
  if (n.includes('طحين') || n.includes('flour') || n.includes('خبز') || n.includes('كماج')) return 'fa-bread-slice';
  if (n.includes('حمص') || n.includes('عدس') || n.includes('فريكة')) return 'fa-seedling';
  if (n.includes('طحينية') || n.includes('tahini')) return 'fa-bowl-food';
  if (n.includes('حلاوة') || n.includes('halawa')) return 'fa-candy-cane';
  if (n.includes('قطايف') || n.includes('qatayef')) return 'fa-cookie-bite';
  if (n.includes('لبن') || n.includes('raib') || n.includes('yogurt')) return 'fa-mug-hot';
  if (n.includes('سمنة') || n.includes('ghee')) return 'fa-droplet';

  return 'fa-box';
}

function getFallbackColor(name: string): string {
  const n = (name || '').toLowerCase();

  // give strong different colors similar to prototype feeling
  if (n.includes('دجاج') || n.includes('chicken')) return '#9C27B0'; // purple
  if (n.includes('خروف') || n.includes('sheep') || n.includes('lamb')) return '#E91E63'; // pink
  if (n.includes('عجل') || n.includes('beef') || n.includes('cow')) return '#FF9800'; // orange
  if (n.includes('بيض') || n.includes('egg')) return '#03A9F4'; // blue
  if (n.includes('جبن') || n.includes('cheese')) return '#4CAF50'; // green
  if (n.includes('زيت') || n.includes('oil')) return '#795548'; // brown
  if (n.includes('سكر') || n.includes('sugar')) return '#00BCD4'; // cyan
  if (n.includes('أرز') || n.includes('rice')) return '#2E7D32'; // dark green
  if (n.includes('طحين') || n.includes('flour')) return '#F44336'; // red
  if (n.includes('حمص') || n.includes('عدس') || n.includes('فريكة')) return '#607D8B'; // blue-grey

  return '#0EA5E9';
}

function formatSignedPercent(v: number, decimals = 1) {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${Math.abs(v).toFixed(decimals)}%`;
}

function badgeStyle(percent: number) {
  if (percent > 0.5) return { text: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' };
  if (percent < -0.5) return { text: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300' };
  return { text: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200' };
}

export function ProductCard({
  product,
  isSelected,
  onToggle,
  isHighestIncrease,
  isLowestDecrease,
  currentWeek
}: ProductCardProps) {
  const weekPrice = product.prices.find(p => p.week_number === currentWeek)?.price ?? 0;
  const prevPrice = currentWeek > 1 ? (product.prices.find(p => p.week_number === currentWeek - 1)?.price ?? 0) : 0;

  // vs reference
  const diffRef = weekPrice - product.reference_price;
  const pctRef = product.reference_price ? (diffRef / product.reference_price) * 100 : 0;

  // vs previous week
  const diffPrev = weekPrice - prevPrice;
  const pctPrev = prevPrice ? (diffPrev / prevPrice) * 100 : 0;

  const isLargeChange = Math.abs(pctRef) > 5;

  const iconValue =
    product.icon && product.icon.trim() && product.icon.trim() !== 'fa-box'
      ? product.icon.trim()
      : getFallbackIcon(product.name);

  // if DB color is default or empty -> fallback
  const defaultBlue = '#0056b3';
  const colorValue =
    product.color && product.color.trim() && product.color.trim().toLowerCase() !== defaultBlue
      ? product.color.trim()
      : getFallbackColor(product.name);

  const refBadge = badgeStyle(pctRef);
  const prevBadge = badgeStyle(pctPrev);

  return (
    <button
      onClick={onToggle}
      className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-5 text-left w-full border-2 ${
        isSelected ? 'border-blue-600 shadow-2xl' : 'border-transparent hover:border-gray-200'
      } ${isLargeChange ? 'relative overflow-hidden' : ''}`}
    >
      {isLargeChange && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse-glow pointer-events-none"></div>
      )}

      <div className="flex items-center gap-4 mb-4 relative">
        <div className="relative">
          <i
            className={`fa-solid ${iconValue} text-5xl transition-transform duration-300 ${
              isSelected ? 'scale-110' : ''
            }`}
            style={{ color: colorValue }}
          />

          {isHighestIncrease && (
            <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 shadow-lg animate-pulse">
              <AlertTriangle className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          )}
          {isLowestDecrease && (
            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 shadow-lg animate-pulse">
              <TrendingDown className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-800">{product.name}</h3>
          {product.weight && (
            <p className="text-sm font-semibold mt-1" style={{ color: colorValue }}>
              {product.weight}
            </p>
          )}
        </div>
      </div>

      <div className="text-center mb-3">
        <div
          className={`text-4xl font-black mb-2 transition-all duration-300 ${isSelected ? 'scale-110' : ''}`}
          style={{ color: colorValue }}
        >
          ₪{weekPrice.toFixed(2)}
        </div>

        {/* ✅ Excel-like badges */}
        <div className="flex flex-wrap justify-center gap-2">
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm border ${refBadge.bg} ${refBadge.border}`}>
            {pctRef > 0.5 ? (
              <TrendingUp className={`w-4 h-4 ${refBadge.text}`} />
            ) : pctRef < -0.5 ? (
              <TrendingDown className={`w-4 h-4 ${refBadge.text}`} />
            ) : (
              <span className={`${refBadge.text}`}>→</span>
            )}
            <span className={`${refBadge.text}`}>عن الإرشادي: {formatSignedPercent(pctRef, 1)}</span>
            <span className="text-gray-500 font-semibold">({formatSignedPercent(diffRef, 2).replace('%','')} ₪)</span>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm border ${prevBadge.bg} ${prevBadge.border}`}>
            {currentWeek === 1 ? (
              <span className="text-gray-600">—</span>
            ) : pctPrev > 0.5 ? (
              <TrendingUp className={`w-4 h-4 ${prevBadge.text}`} />
            ) : pctPrev < -0.5 ? (
              <TrendingDown className={`w-4 h-4 ${prevBadge.text}`} />
            ) : (
              <span className={`${prevBadge.text}`}>→</span>
            )}
            <span className={`${prevBadge.text}`}>
              عن الأسبوع السابق: {currentWeek === 1 ? '—' : formatSignedPercent(pctPrev, 1)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600 pt-3 border-t border-gray-100">
        <div>
          <span className="font-semibold">السعر الإرشادي: </span>
          <span className="text-gray-500">₪{product.reference_price.toFixed(2)}</span>
        </div>
        <div className="text-gray-400">الأسبوع {currentWeek}</div>
      </div>
    </button>
  );
}
