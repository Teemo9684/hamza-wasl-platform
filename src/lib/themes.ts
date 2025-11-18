// Theme definitions for special occasions
export interface ThemeColors {
  name: string;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    accent: string;
    background: string;
    foreground: string;
  };
  gradients?: {
    primary: string;
    hero: string;
  };
}

export const themes: Record<string, ThemeColors> = {
  default: {
    name: 'default',
    displayName: 'الثيم الافتراضي',
    description: 'التصميم الأساسي للمنصة',
    colors: {
      primary: '221.2 83.2% 53.3%',
      primaryLight: '220 90% 68%',
      primaryDark: '222 90% 43%',
      secondary: '217.2 91.2% 59.8%',
      secondaryLight: '217 95% 74%',
      secondaryDark: '217 85% 48%',
      accent: '142.1 76.2% 36.3%',
      background: '0 0% 100%',
      foreground: '222.2 84% 4.9%',
    },
  },
  
  eid_fitr: {
    name: 'eid_fitr',
    displayName: 'عيد الفطر المبارك',
    description: 'ثيم احتفالي بهيج لعيد الفطر',
    colors: {
      primary: '142 76% 36%',      // أخضر زمردي
      primaryLight: '142 71% 52%',
      primaryDark: '142 81% 26%',
      secondary: '45 93% 47%',     // ذهبي
      secondaryLight: '45 98% 62%',
      secondaryDark: '45 88% 37%',
      accent: '340 82% 52%',       // وردي فاتح
      background: '0 0% 100%',
      foreground: '142 84% 12%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(45 93% 47%))',
      hero: 'linear-gradient(180deg, hsl(142 71% 52%), hsl(340 82% 52%))',
    },
  },
  
  eid_adha: {
    name: 'eid_adha',
    displayName: 'عيد الأضحى المبارك',
    description: 'ثيم أنيق لعيد الأضحى المبارك',
    colors: {
      primary: '25 95% 53%',       // برتقالي
      primaryLight: '25 90% 68%',
      primaryDark: '25 100% 43%',
      secondary: '142 76% 36%',    // أخضر
      secondaryLight: '142 71% 52%',
      secondaryDark: '142 81% 26%',
      accent: '45 93% 47%',        // ذهبي
      background: '0 0% 100%',
      foreground: '25 84% 12%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(142 76% 36%))',
      hero: 'linear-gradient(180deg, hsl(45 93% 47%), hsl(25 90% 68%))',
    },
  },
  
  mawlid: {
    name: 'mawlid',
    displayName: 'المولد النبوي الشريف',
    description: 'ثيم روحاني للمولد النبوي الشريف',
    colors: {
      primary: '142 71% 45%',      // أخضر نبوي
      primaryLight: '142 66% 60%',
      primaryDark: '142 76% 35%',
      secondary: '45 93% 47%',     // ذهبي
      secondaryLight: '45 98% 62%',
      secondaryDark: '45 88% 37%',
      accent: '210 80% 48%',       // أزرق فاتح
      background: '0 0% 100%',
      foreground: '142 84% 15%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(142 71% 45%), hsl(210 80% 48%))',
      hero: 'linear-gradient(180deg, hsl(45 93% 47%), hsl(142 66% 60%))',
    },
  },
  
  national_day: {
    name: 'national_day',
    displayName: 'اليوم الوطني',
    description: 'ثيم وطني بألوان العلم',
    colors: {
      primary: '142 76% 36%',      // أخضر
      primaryLight: '142 71% 52%',
      primaryDark: '142 81% 26%',
      secondary: '0 0% 98%',       // أبيض
      secondaryLight: '0 0% 100%',
      secondaryDark: '0 0% 90%',
      accent: '0 84% 60%',         // أحمر
      background: '0 0% 100%',
      foreground: '142 84% 12%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(0 0% 98%), hsl(0 84% 60%))',
      hero: 'linear-gradient(180deg, hsl(142 71% 52%), hsl(0 84% 60%))',
    },
  },
  
  ramadan: {
    name: 'ramadan',
    displayName: 'شهر رمضان المبارك',
    description: 'ثيم روحاني لشهر رمضان',
    colors: {
      primary: '262 83% 58%',      // بنفسجي
      primaryLight: '262 78% 73%',
      primaryDark: '262 88% 48%',
      secondary: '45 93% 47%',     // ذهبي
      secondaryLight: '45 98% 62%',
      secondaryDark: '45 88% 37%',
      accent: '210 80% 48%',       // أزرق
      background: '0 0% 100%',
      foreground: '262 84% 12%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(45 93% 47%))',
      hero: 'linear-gradient(180deg, hsl(262 78% 73%), hsl(210 80% 48%))',
    },
  },
  
  new_year: {
    name: 'new_year',
    displayName: 'رأس السنة الميلادية',
    description: 'ثيم احتفالي لرأس السنة',
    colors: {
      primary: '0 84% 60%',        // أحمر
      primaryLight: '0 79% 75%',
      primaryDark: '0 89% 50%',
      secondary: '142 76% 36%',    // أخضر
      secondaryLight: '142 71% 52%',
      secondaryDark: '142 81% 26%',
      accent: '45 93% 47%',        // ذهبي
      background: '0 0% 100%',
      foreground: '0 84% 12%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(0 84% 60%), hsl(142 76% 36%))',
      hero: 'linear-gradient(180deg, hsl(45 93% 47%), hsl(0 79% 75%))',
    },
  },
  
  hijri_new_year: {
    name: 'hijri_new_year',
    displayName: 'رأس السنة الهجرية',
    description: 'ثيم إسلامي لرأس السنة الهجرية',
    colors: {
      primary: '210 80% 48%',      // أزرق إسلامي
      primaryLight: '210 75% 63%',
      primaryDark: '210 85% 38%',
      secondary: '45 93% 47%',     // ذهبي
      secondaryLight: '45 98% 62%',
      secondaryDark: '45 88% 37%',
      accent: '142 76% 36%',       // أخضر
      background: '0 0% 100%',
      foreground: '210 84% 12%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(210 80% 48%), hsl(45 93% 47%))',
      hero: 'linear-gradient(180deg, hsl(210 75% 63%), hsl(142 76% 36%))',
    },
  },
};