// src/lib/csvLoader.ts
// Reads CSV files served by the same PCBS server (no Supabase needed).

import { ProductWithPrices } from '../types';

type Lang = 'ar' | 'en';

interface CSVProduct {
  id: string;
  name_ar: string;
  name_en: string;
  unit_ar: string;
  unit_en: string;
  icon: string;
  color: string;
  reference_price: number;
  display_order: number;
}

interface CSVPrice {
  id: string;
  product_id: string;
  week_number: number;
  price: number;
  week_date?: string;
}

function normalizeId(v: any): string {
  // keep leading zeros if present in source; otherwise just stringify
  return String(v ?? '').trim();
}

// Parse CSV text to array of objects (supports quoted values and commas)
function parseCSV<T>(csvText: string): T[] {
  const text = (csvText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  if (!text) return [];

  const rows: string[][] = [];
  let curRow: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    curRow.push(field);
    field = '';
  };

  const pushRow = () => {
    if (curRow.some(v => v.trim() !== '')) rows.push(curRow);
    curRow = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
      continue;
    }

    if (c === ',') {
      pushField();
      continue;
    }

    if (c === '\n') {
      pushField();
      pushRow();
      continue;
    }

    field += c;
  }

  pushField();
  pushRow();

  const headers = (rows.shift() || []).map(h => h.trim());
  return rows.map((r) => {
    const obj: any = {};
    headers.forEach((h, idx) => (obj[h] = (r[idx] ?? '').trim()));
    return obj as T;
  });
}

function num(v: any, fallback = 0) {
  const n = Number(String(v ?? '').replace(/[^0-9.+-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

function defaultIcon(v: string) {
  const s = (v || '').trim();
  return s || 'fa-box';
}

function defaultColor(v: string) {
  const s = (v || '').trim();
  return s || '#0056b3';
}

export async function loadProductsFromCSV(lang: Lang = 'ar'): Promise<ProductWithPrices[]> {
  const [productsRes, pricesRes] = await Promise.all([
    fetch('/data/products.csv', { cache: 'no-store' }),
    fetch('/data/weekly_prices.csv', { cache: 'no-store' }),
  ]);

  if (!productsRes.ok || !pricesRes.ok) {
    throw new Error('CSV files not found. Expected: /data/products.csv and /data/weekly_prices.csv');
  }

  const productsText = await productsRes.text();
  const pricesText = await pricesRes.text();

  const csvProducts = parseCSV<CSVProduct>(productsText)
    .map(p => ({
      ...p,
      id: normalizeId(p.id),
      reference_price: num((p as any).reference_price),
      display_order: num((p as any).display_order),
    }))
    .filter(p => p.id);

  const csvPrices = parseCSV<CSVPrice>(pricesText)
    .map(p => ({
      ...p,
      id: normalizeId(p.id),
      product_id: normalizeId((p as any).product_id),
      week_number: num((p as any).week_number),
      price: num((p as any).price),
      week_date: ((p as any).week_date || '').trim() || undefined,
    }))
    .filter(p => p.product_id && p.week_number);

  const byProduct = new Map<string, any[]>();
  csvPrices.forEach((pr: any) => {
    const arr = byProduct.get(pr.product_id) || [];
    arr.push(pr);
    byProduct.set(pr.product_id, arr);
  });

  const list: ProductWithPrices[] = csvProducts
    .sort((a, b) => (a.display_order || 9999) - (b.display_order || 9999))
    .map((p) => {
      const prices = (byProduct.get(p.id) || []).sort((a, b) => a.week_number - b.week_number);

      const name = lang === 'en' ? (p.name_en || p.name_ar) : (p.name_ar || p.name_en);
      const unit = lang === 'en' ? (p.unit_en || p.unit_ar) : (p.unit_ar || p.unit_en);

      return {
        id: p.id,
        name,
        icon: defaultIcon((p as any).icon),
        color: defaultColor((p as any).color),
        weight: unit,
        reference_price: p.reference_price || 0,
        display_order: p.display_order || 9999,
        prices,
      };
    });

  return list;
}
