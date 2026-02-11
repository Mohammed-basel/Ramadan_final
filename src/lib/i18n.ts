export type Lang = 'ar' | 'en';

export function detectLangFromUrl(): Lang {
  if (typeof window === 'undefined') return 'ar';
  const p = window.location.pathname.toLowerCase();
  // Your official links:
  // - /ramadan2026/      -> Arabic
  // - /ramadan2026/en/   -> English
  return p.includes('/en') ? 'en' : 'ar';
}

export const I18N = {
  ar: {
    pageTitle: 'منصة رصد أسعار بعض السلع الأساسية خلال شهر رمضان المبارك',
    pageSubtitle: 'متابعة وتحليل أسعار السلع الاستهلاكية المختارة خلال شهر رمضان',
    complianceRate: 'نسبة الالتزام بالسعر الاسترشادي',
    lowCompliance: 'مستوى التزام منخفض',
    highestIncrease: 'أعلى نسبة ارتفاع عن السعر الاسترشادي',
    largestDecrease: 'أكبر نسبة انخفاض عن السعر الاسترشادي',
    methodology: 'المنهجية',
    chartTitle:
      'نسب التغير ومستويات الأسعار أسبوعيا للسلع الأساسية خلال شهر رمضان مقارنة بالأسعار الاسترشادية',
    weeklyPrice: 'السعر الأسبوعي',
    changeVsIndicative: 'التغير % عن الإرشادي',
    indicativePrice: 'السعر الإرشادي',
    week: 'الأسبوع',
    all: 'الكل',
    price: 'السعر',
    change: 'التغير',
    downloadChart: 'تنزيل الرسم',
    searchPlaceholder: 'ابحث عن سلعة...',
    priceChangeFilter: 'تغير السعر',
    filterAll: 'الكل',
    filterIncrease: 'ارتفاع',
    filterDecrease: 'انخفاض',
    filterStable: 'ثابت',
    previousWeekPrice: 'السعر للأسبوع السابق',
    changeFromPrevious: 'نسبة التغيير عن الأسبوع السابق',
    na: 'NA',
    dataFilesNote:
      'يرجى وضع ملفات CSV داخل مجلد /data/ على الخادم (products.csv و weekly_prices.csv).',
    methodologyTitle: 'Title: حركة أسعار سلع أساسية مختارة خلال شهر رمضان المبارك',
    methodologySource: 'المصدر: الجهاز المركزي للإحصاء الفلسطيني',
  },
  en: {
    pageTitle: 'A platform for monitoring the prices of some basic commodities during the holy month “Ramadan”',
    pageSubtitle: 'Monitoring and analyzing the prices of selected consumer goods during the holy  month “Ramadan”',
    complianceRate: 'Rate of compliance with the indicative price',
    lowCompliance: 'Low level of commitment',
    highestIncrease: 'Highest percentage increase above the indicative price',
    largestDecrease: 'Largest percentage decrease from the indicative price',
    methodology: 'Methodology',
    chartTitle:
      'Rates of change and weekly price levels for basic commodities during Ramadan compared to indicative prices',
    weeklyPrice: 'Weekly price',
    changeVsIndicative: 'Change % vs indicative',
    indicativePrice: 'Indicative price',
    week: 'Week',
    all: 'All',
    price: 'Price',
    change: 'Change',
    downloadChart: 'Download chart',
    searchPlaceholder: 'Search a commodity...',
    priceChangeFilter: 'Price change',
    filterAll: 'All',
    filterIncrease: 'Increase',
    filterDecrease: 'Decrease',
    filterStable: 'Stable',
    previousWeekPrice: 'Previous week price',
    changeFromPrevious: '% change vs previous week',
    na: 'NA',
    dataFilesNote:
      'Put the CSV files under /data/ on the server (products.csv and weekly_prices.csv).',
    methodologyTitle: 'Title: Price Movements of Selected Basic Commodities During the Holy Month "Ramadan"',
    methodologySource: 'Source: Palestinian Central Bureau of Statistics',
  },
} as const;

export function t(lang: Lang, key: keyof typeof I18N.ar) {
  return (I18N as any)[lang]?.[key] ?? (I18N as any).ar[key] ?? String(key);
}
