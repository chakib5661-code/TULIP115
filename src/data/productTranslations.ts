import { AppLanguage } from '../translations';
import { Product } from '../types';

export interface LocalizedProductInfo {
  name: string;
  description: string;
  category?: string;
  origin?: string;
}

export const PRODUCT_TRANSLATIONS: Record<string, Record<'ar' | 'en', LocalizedProductInfo>> = {
  'ext-001': {
    ar: {
      name: 'خلاصة دهن العود الملكي النقي (مركز 100%)',
      description: 'مركز عطري زيتي نقي 100%، بنفحات عميقة من العود الكمبودي الفاخر والتوابل الشرقية النادرة. يباع بالغرام (1غ) في عبوات أصلية محكمة الإغلاق سعة 100غ.',
      category: 'خشبي وشرقي',
      origin: 'غراس (فرنسا)',
    },
    en: {
      name: 'Pure Royal Oud Extract (Concentrate)',
      description: '100% pure oily fragrance concentrate featuring rich Cambodian oud and fine exotic spices. Sold per gram (1g) in sealed 100g original containers.',
      category: 'Woody & Oriental',
      origin: 'Grasse (France)',
    },
  },
  'ext-002': {
    ar: {
      name: 'خلاصة مسك الطهارة الأبيض الأصلي',
      description: 'مسك أبيض كريمي عالي الكثافة ذو قوام مخملي أصيل وثباتية فائقة. يباع بالغرام (1غ) في عبوات محكمة سعة 100غ للمحترفين وصناع العطور.',
      category: 'مسكي وبودري',
      origin: 'دبي (الإمارات)',
    },
    en: {
      name: 'Original White Musk Tahara Extract',
      description: 'High-density creamy white musk with authentic velvety texture and supreme longevity. Sold per gram (1g) in sealed 100g containers.',
      category: 'Musky & Powdery',
      origin: 'Dubai (UAE)',
    },
  },
  'ext-003': {
    ar: {
      name: 'خلاصة مركزة نمط روج 540',
      description: 'زيت عطري فواح وعنبري مع لمسات فاخرة من الزعفران والياسمين وخشب الأرز الأبيض. بيع بالجملة بالغرام في عبوة 100غ.',
      category: 'عنبري زهري',
      origin: 'غراس (فرنسا)',
    },
    en: {
      name: 'Rouge 540 Style Pure Extract Concentrate',
      description: 'Concentrated amber-floral perfume oil with luminous notes of saffron, Egyptian jasmine, and white cedarwood. Sold per gram in 100g sealed bottles.',
      category: 'Amber Floral',
      origin: 'Grasse (France)',
    },
  },
  'ext-004': {
    ar: {
      name: 'خلاصة ورد ماي والورد الجوري الدمشقي',
      description: 'مستخلص زهري طبيعي فائق النقاء من بتلات الورد المقطوفة عند الفجر. يباع بالغرام (1غ) في عبوات أصلية سعة 100غ.',
      category: 'زهري نقي',
      origin: 'بلغاريا',
    },
    en: {
      name: 'Rose de Mai & Damascena Pure Extract',
      description: 'Pure floral rose essence harvest-fresh at dawn, delivering quintessential natural rose petals aroma. Sold by the gram in 100g sealed containers.',
      category: 'Pure Floral',
      origin: 'Bulgaria',
    },
  },
  'ext-005': {
    ar: {
      name: 'خلاصة خشب الصندل الأسترالي الفاخر',
      description: 'قاعدة عطرية خشبية كريمية ودافئة، مثبت عطري لا غنى عنه لصناع العطور المحترفين. يباع بالغرام (1غ) في عبوات 100غ.',
      category: 'خشبي عطري',
      origin: 'أستراليا',
    },
    en: {
      name: 'Australian Sandalwood Pure Extract',
      description: 'Warm, rich and creamy woody base note, regarded as an essential fixative for professional perfume compounding. Sold per gram in 100g containers.',
      category: 'Woody Aromatic',
      origin: 'Australia',
    },
  },
  'ext-006': {
    ar: {
      name: 'خلاصة قرون فانيليا البوربون النقية',
      description: 'مستخلص نقي غني بالفانيلين الطبيعي مع لمسات كراميلية دافئة وناعمة. بيع احترافي بالغرام في عبوات 100غ.',
      category: 'حلو ودافئ',
      origin: 'مدغشقر',
    },
    en: {
      name: 'Bourbon Vanilla Pods Pure Extract',
      description: 'Noble gourmand concentrate rich in natural vanillin with nuanced balsamic and caramelized notes. Sold by gram in 100g bottles.',
      category: 'Gourmand & Warm',
      origin: 'Madagascar',
    },
  },
  'ext-007': {
    ar: {
      name: 'خلاصة برغموت كالابريا النقي (مفلتر)',
      description: 'حمضيات إيطالية فاخرة من كالابريا، منقى ومعالج لضمان أعلى مستويات الأمان وثبات الرائحة المنعشة.',
      category: 'حمضي منعش',
      origin: 'إيطاليا (كالابريا)',
    },
    en: {
      name: 'Calabrian Bergamot Deterpenated Essence',
      description: 'Exceptional Italian citrus essence free of furocoumarins, offering crisp uplifting bergamot freshness. Sold per gram.',
      category: 'Fresh Citrus',
      origin: 'Italy (Calabria)',
    },
  },
  'flac-001': {
    ar: {
      name: 'قارورة زجاجية مربعة فاخرة 50مل (صندوق 50 قطعة)',
      description: 'زجاج سميق نقي عالي الجودة مع فتحة قياسية FEA 15 وقاعدة ثقيلة أنيقة. تأتي مع مضخات رذاذ ذهبية وأغطية فاخرة.',
      category: 'قارورة بخاخ زجاجية',
      origin: 'استيراد إيطاليا',
    },
    en: {
      name: 'Heavy Glass Square Bottle 50ml (Box of 50)',
      description: 'Premium heavy crystal glass bottle with FEA 15 neck and beveled thick base. Includes golden mist spray pumps and caps.',
      category: 'Glass Spray Bottle',
      origin: 'Import Italy',
    },
  },
  'flac-002': {
    ar: {
      name: 'قارورة أسطوانية بريستيج 100مل (صندوق 36 قطعة)',
      description: 'تصميم أسطواني حديث وراقي سعة 100مل، مضخة رذاذ مع غطاء ألمنيوم أسود مطفأ بمغناطيس إغلاق فاخر.',
      category: 'قارورة بخاخ زجاجية',
      origin: 'استيراد إسبانيا',
    },
    en: {
      name: 'Prestige Cylindrical Glass Bottle 100ml (Box of 36)',
      description: 'Sleek cylindrical 100ml design with precision crimp/screw pump and brushed matte black magnetic aluminum overcap.',
      category: 'Glass Spray Bottle',
      origin: 'Import Spain',
    },
  },
  'flac-003': {
    ar: {
      name: 'قارورة رول أون زجاج عسلي 6مل (صندوق 100 قطعة)',
      description: 'زجاج داكن يحمي من الأشعة فوق البنفسجية مع كرة دوارة من الفولاذ المقاوم للصدأ محكمة الإغلاق، مثالية للزيوت والمسك.',
      category: 'رول أون وزيوت',
      origin: 'استيراد',
    },
    en: {
      name: 'Amber Glass Roll-On Bottle 6ml (Box of 100)',
      description: 'UV-protective amber glass with leak-proof stainless steel rollerball. Ideal for pure perfume oils and liquid musk.',
      category: 'Roll-on & Oil Bottles',
      origin: 'Import',
    },
  },
  'flac-004': {
    ar: {
      name: 'عبوة ألمنيوم أنوديز سعة 1 لتر (مختبر وورشة)',
      description: 'وعاء ألمنيوم محكم الإغلاق ومطابق للمعايير، يحمي المواد الأولية من الضوء والأكسدة والحرارة.',
      category: 'تخزين ومختبر',
      origin: 'محلي / مطابق للمواصفات',
    },
    en: {
      name: 'Anodized Aluminum Container 1 Liter (Lab Grade)',
      description: 'Sealed food-grade aluminum canister with tamper-evident screw cap. Complete protection against light and oxidation.',
      category: 'Storage & Laboratory',
      origin: 'Local / EU Grade',
    },
  },
  'flac-005': {
    ar: {
      name: 'تولة شرقية فاخرة مزخرفة بالذهب 12مل (صندوق 40 قطعة)',
      description: 'تولة زجاجية راقية مرصعة بنقوش عربية ذهبية مع مرواد بلوري زجاجي، ممتازة لتعبئة دهن العود والمخلطات الشرقية.',
      category: 'تولات وقوارير مزخرفة',
      origin: 'الإمارات',
    },
    en: {
      name: 'Luxury Gold Ornamental Tola Bottle 12ml (Box of 40)',
      description: 'Exquisite oriental flacon embellished with gold arabesque filigree and glass applicator wand. Highly sought for Oud oils.',
      category: 'Decorated Bottles',
      origin: 'UAE',
    },
  },
  'flac-006': {
    ar: {
      name: 'قوارير عينات وتجربة 2مل (كيس 200 قطعة)',
      description: 'قوارير صغيرة شفافة 2مل مع غطاء وقضيب سحب، ضرورية لعينات الزبائن وتجربة العطور في المحلات والورشات.',
      category: 'عينات وتجربة',
      origin: 'استيراد',
    },
    en: {
      name: 'Tester Sample Vials 2ml (Bag of 200)',
      description: 'Transparent 2ml mini vials with dipstick cap. Indispensable for perfumery testing, promotions, and customer samples.',
      category: 'Sampling & Discovery',
      origin: 'Import',
    },
  },
};

/**
 * Returns localized name and description for any product based on current app language.
 */
export function getProductLocalizedDetails(
  product: Product,
  lang: AppLanguage | string = 'fr'
): { name: string; description: string; category: string; origin: string } {
  if (lang === 'fr') {
    return {
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      origin: product.origin || '',
    };
  }

  const translations = PRODUCT_TRANSLATIONS[product.id] || PRODUCT_TRANSLATIONS[product.code];
  if (translations && translations[lang]) {
    const localized = translations[lang];
    return {
      name: localized.name || product.name,
      description: localized.description || product.description || '',
      category: localized.category || product.category || '',
      origin: localized.origin || product.origin || '',
    };
  }

  return {
    name: product.name,
    description: product.description || '',
    category: product.category || '',
    origin: product.origin || '',
  };
}
