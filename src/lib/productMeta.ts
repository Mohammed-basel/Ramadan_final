import { ProductWithPrices } from '../types';

export type Language = 'ar' | 'en';

type ProductLabels = Record<string, { ar: string; en: string }>;
type ProductMeta = Record<string, { icon: string; color: string }>;

// Short display names by product code.
// The CSV `name` can be longer (brand/packaging). The UI uses these labels.
export const PRODUCT_LABELS: ProductLabels = {
  '011100103': { ar: 'أرز حبة قصيرة', en: 'Short-grain rice' },
  '011100107': { ar: 'أرز حبة طويلة', en: 'Long-grain rice' },
  '011100301': { ar: 'خبز كماج', en: 'Ka’maj bread' },
  '011210102': { ar: 'لحم عجل طازج', en: 'Fresh veal' },
  '011210201': { ar: 'لحم عجل مجمد', en: 'Frozen veal' },
  '011220102': { ar: 'دجاج منظف', en: 'Cleaned chicken' },
  '011420303': { ar: 'جبنة غنم بيضاء', en: 'White sheep cheese' },
  '011430001': { ar: 'بيض دجاج', en: 'Chicken eggs' },
  '011510203': { ar: 'زيت الذرة', en: 'Corn oil' },
  '011510204': { ar: 'زيت عباد الشمس', en: 'Sunflower oil' },
  '011520101': { ar: 'سمنة نباتية', en: 'Vegetable ghee' },
  '011800105': { ar: 'سكر', en: 'Sugar' },
  '011800202': { ar: 'حلاوة', en: 'Halawa' },
  '011930206': { ar: 'طحينية', en: 'Tahini' },
  '011100604': { ar: 'قطايف', en: 'Qatayef' },
  '011101301': { ar: 'فريكة', en: 'Freekeh' },
  '011740201': { ar: 'عدس مجروش', en: 'Cracked lentils' },
  '011740302': { ar: 'حمص حب', en: 'Dried chickpeas' },
  '011210107': { ar: 'لحم خروف طازج', en: 'Fresh lamb' },
  '011210203': { ar: 'لحم خروف مجمد', en: 'Frozen lamb' },
  '011420105': { ar: 'لبن رايب', en: 'Laban (raib)' },
};

// Icons and colors by product code. (Font Awesome 6 free icons)
export const PRODUCT_META: ProductMeta = {
  '011100103': { icon: 'fa-bowl-rice', color: '#2E7D32' },
  '011100107': { icon: 'fa-bowl-rice', color: '#43A047' },
  '011100301': { icon: 'fa-bread-slice', color: '#F44336' },
  '011210102': { icon: 'fa-cow', color: '#FF9800' },
  '011210201': { icon: 'fa-snowflake', color: '#FB8C00' },
  '011220102': { icon: 'fa-drumstick-bite', color: '#9C27B0' },
  '011420303': { icon: 'fa-cheese', color: '#4CAF50' },
  '011430001': { icon: 'fa-egg', color: '#03A9F4' },
  '011510203': { icon: 'fa-oil-can', color: '#795548' },
  '011510204': { icon: 'fa-sun', color: '#F59E0B' },
  '011520101': { icon: 'fa-droplet', color: '#64748B' },
  '011800105': { icon: 'fa-cubes', color: '#06B6D4' },
  '011800202': { icon: 'fa-candy-cane', color: '#E91E63' },
  '011930206': { icon: 'fa-bowl-food', color: '#8D6E63' },
  '011100604': { icon: 'fa-cookie-bite', color: '#F97316' },
  '011101301': { icon: 'fa-seedling', color: '#16A34A' },
  '011740201': { icon: 'fa-seedling', color: '#22C55E' },
  '011740302': { icon: 'fa-seedling', color: '#15803D' },
  '011210107': { icon: 'fa-sheep', color: '#EC4899' },
  '011210203': { icon: 'fa-snowflake', color: '#DB2777' },
  '011420105': { icon: 'fa-mug-hot', color: '#0EA5E9' },
};

export function getProductDisplayName(product: ProductWithPrices, language: Language): string {
  const labels = PRODUCT_LABELS[product.id];
  if (labels) return labels[language] || labels.ar;
  return product.name;
}

export function getProductIcon(product: ProductWithPrices): string {
  const meta = PRODUCT_META[product.id];
  if (product.icon && product.icon.trim() && product.icon.trim() !== 'fa-box') return product.icon.trim();
  return meta?.icon || 'fa-box';
}

export function getProductColor(product: ProductWithPrices): string {
  const meta = PRODUCT_META[product.id];
  const defaultBlue = '#0056b3';
  if (product.color && product.color.trim() && product.color.trim().toLowerCase() !== defaultBlue) return product.color.trim();
  return meta?.color || '#0EA5E9';
}

export function normalizeForSearch(s: string): string {
  return (s || '')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .trim();
}
