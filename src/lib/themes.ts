// Theme definitions for special occasions
export interface ThemeColors {
  name: string;
  displayName: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    card: string;
    cardForeground: string;
    popover: string;
    popoverForeground: string;
    primary: string;
    primaryForeground: string;
    primaryLight: string;
    primaryDark: string;
    secondary: string;
    secondaryForeground: string;
    secondaryLight: string;
    secondaryDark: string;
    muted: string;
    mutedForeground: string;
    accent: string;
    accentForeground: string;
    destructive: string;
    destructiveForeground: string;
    border: string;
    input: string;
    ring: string;
  };
  gradients?: {
    primary: string;
    secondary: string;
    accent: string;
    hero: string;
  };
}

const createBaseColors = (primary: string, secondary: string, accent: string) => ({
  background: '210 40% 98%',
  foreground: '222 47% 15%',
  card: '0 0% 100%',
  cardForeground: '222 47% 15%',
  popover: '0 0% 100%',
  popoverForeground: '222 47% 15%',
  primaryForeground: '0 0% 100%',
  secondaryForeground: '0 0% 100%',
  muted: '210 30% 96%',
  mutedForeground: '210 10% 50%',
  accentForeground: '0 0% 100%',
  destructive: '0 84% 60%',
  destructiveForeground: '0 0% 100%',
  border: '210 20% 90%',
  input: '210 20% 90%',
});

export const themes: Record<string, ThemeColors> = {
  default: {
    name: 'default',
    displayName: 'الثيم الافتراضي',
    description: 'التصميم الأساسي للمنصة',
    colors: {
      ...createBaseColors('200 95% 55%', '145 70% 50%', '30 95% 58%'),
      primary: '200 95% 55%',
      primaryLight: '200 95% 65%',
      primaryDark: '200 95% 45%',
      secondary: '145 70% 50%',
      secondaryLight: '145 70% 60%',
      secondaryDark: '145 70% 40%',
      accent: '30 95% 58%',
      ring: '200 95% 55%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(200, 95%, 55%), hsl(270, 80%, 60%))',
      secondary: 'linear-gradient(135deg, hsl(145, 70%, 50%), hsl(30, 95%, 58%))',
      accent: 'linear-gradient(135deg, hsl(30, 95%, 58%), hsl(340, 85%, 60%))',
      hero: 'linear-gradient(135deg, hsl(200, 95%, 55%) 0%, hsl(270, 80%, 60%) 50%, hsl(340, 85%, 60%) 100%)',
    },
  },
  
  eid_fitr: {
    name: 'eid_fitr',
    displayName: 'عيد الفطر المبارك',
    description: 'ثيم احتفالي بهيج لعيد الفطر',
    colors: {
      ...createBaseColors('142 76% 36%', '45 93% 47%', '340 82% 52%'),
      primary: '142 76% 36%',
      primaryLight: '142 71% 52%',
      primaryDark: '142 81% 26%',
      secondary: '45 93% 47%',
      secondaryLight: '45 98% 62%',
      secondaryDark: '45 88% 37%',
      accent: '340 82% 52%',
      ring: '142 76% 36%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(45 93% 47%))',
      secondary: 'linear-gradient(135deg, hsl(45 93% 47%), hsl(340 82% 52%))',
      accent: 'linear-gradient(135deg, hsl(340 82% 52%), hsl(142 71% 52%))',
      hero: 'linear-gradient(180deg, hsl(142 71% 52%), hsl(340 82% 52%))',
    },
  },
  
  eid_adha: {
    name: 'eid_adha',
    displayName: 'عيد الأضحى المبارك',
    description: 'ثيم أنيق لعيد الأضحى المبارك',
    colors: {
      ...createBaseColors('25 95% 53%', '142 76% 36%', '45 93% 47%'),
      primary: '25 95% 53%',
      primaryLight: '25 90% 68%',
      primaryDark: '25 100% 43%',
      secondary: '142 76% 36%',
      secondaryLight: '142 71% 52%',
      secondaryDark: '142 81% 26%',
      accent: '45 93% 47%',
      ring: '25 95% 53%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(25 95% 53%), hsl(142 76% 36%))',
      secondary: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(45 93% 47%))',
      accent: 'linear-gradient(135deg, hsl(45 93% 47%), hsl(25 90% 68%))',
      hero: 'linear-gradient(180deg, hsl(45 93% 47%), hsl(25 90% 68%))',
    },
  },
  
  mawlid: {
    name: 'mawlid',
    displayName: 'المولد النبوي الشريف',
    description: 'ثيم روحاني للمولد النبوي الشريف',
    colors: {
      ...createBaseColors('142 71% 45%', '45 93% 47%', '210 80% 48%'),
      primary: '142 71% 45%',
      primaryLight: '142 66% 60%',
      primaryDark: '142 76% 35%',
      secondary: '45 93% 47%',
      secondaryLight: '45 98% 62%',
      secondaryDark: '45 88% 37%',
      accent: '210 80% 48%',
      ring: '142 71% 45%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(142 71% 45%), hsl(210 80% 48%))',
      secondary: 'linear-gradient(135deg, hsl(45 93% 47%), hsl(142 66% 60%))',
      accent: 'linear-gradient(135deg, hsl(210 80% 48%), hsl(45 93% 47%))',
      hero: 'linear-gradient(180deg, hsl(45 93% 47%), hsl(142 66% 60%))',
    },
  },
  
  national_day: {
    name: 'national_day',
    displayName: 'اليوم الوطني',
    description: 'ثيم وطني بألوان العلم',
    colors: {
      ...createBaseColors('142 76% 36%', '0 0% 98%', '0 84% 60%'),
      primary: '142 76% 36%',
      primaryLight: '142 71% 52%',
      primaryDark: '142 81% 26%',
      secondary: '0 0% 98%',
      secondaryLight: '0 0% 100%',
      secondaryDark: '0 0% 90%',
      accent: '0 84% 60%',
      ring: '142 76% 36%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(0 0% 98%), hsl(0 84% 60%))',
      secondary: 'linear-gradient(135deg, hsl(0 0% 98%), hsl(0 84% 60%))',
      accent: 'linear-gradient(135deg, hsl(0 84% 60%), hsl(142 76% 36%))',
      hero: 'linear-gradient(180deg, hsl(142 71% 52%), hsl(0 84% 60%))',
    },
  },
  
  ramadan: {
    name: 'ramadan',
    displayName: 'شهر رمضان المبارك',
    description: 'ثيم روحاني لشهر رمضان',
    colors: {
      ...createBaseColors('262 83% 58%', '45 93% 47%', '210 80% 48%'),
      primary: '262 83% 58%',
      primaryLight: '262 78% 73%',
      primaryDark: '262 88% 48%',
      secondary: '45 93% 47%',
      secondaryLight: '45 98% 62%',
      secondaryDark: '45 88% 37%',
      accent: '210 80% 48%',
      ring: '262 83% 58%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(262 83% 58%), hsl(45 93% 47%))',
      secondary: 'linear-gradient(135deg, hsl(45 93% 47%), hsl(210 80% 48%))',
      accent: 'linear-gradient(135deg, hsl(210 80% 48%), hsl(262 78% 73%))',
      hero: 'linear-gradient(180deg, hsl(262 78% 73%), hsl(210 80% 48%))',
    },
  },
  
  new_year: {
    name: 'new_year',
    displayName: 'رأس السنة الميلادية',
    description: 'ثيم احتفالي لرأس السنة',
    colors: {
      ...createBaseColors('0 84% 60%', '142 76% 36%', '45 93% 47%'),
      primary: '0 84% 60%',
      primaryLight: '0 79% 75%',
      primaryDark: '0 89% 50%',
      secondary: '142 76% 36%',
      secondaryLight: '142 71% 52%',
      secondaryDark: '142 81% 26%',
      accent: '45 93% 47%',
      ring: '0 84% 60%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(0 84% 60%), hsl(142 76% 36%))',
      secondary: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(45 93% 47%))',
      accent: 'linear-gradient(135deg, hsl(45 93% 47%), hsl(0 79% 75%))',
      hero: 'linear-gradient(180deg, hsl(45 93% 47%), hsl(0 79% 75%))',
    },
  },
  
  hijri_new_year: {
    name: 'hijri_new_year',
    displayName: 'رأس السنة الهجرية',
    description: 'ثيم إسلامي لرأس السنة الهجرية',
    colors: {
      ...createBaseColors('210 80% 48%', '45 93% 47%', '142 76% 36%'),
      primary: '210 80% 48%',
      primaryLight: '210 75% 63%',
      primaryDark: '210 85% 38%',
      secondary: '45 93% 47%',
      secondaryLight: '45 98% 62%',
      secondaryDark: '45 88% 37%',
      accent: '142 76% 36%',
      ring: '210 80% 48%',
    },
    gradients: {
      primary: 'linear-gradient(135deg, hsl(210 80% 48%), hsl(45 93% 47%))',
      secondary: 'linear-gradient(135deg, hsl(45 93% 47%), hsl(142 76% 36%))',
      accent: 'linear-gradient(135deg, hsl(142 76% 36%), hsl(210 75% 63%))',
      hero: 'linear-gradient(180deg, hsl(210 75% 63%), hsl(142 76% 36%))',
    },
  },
};