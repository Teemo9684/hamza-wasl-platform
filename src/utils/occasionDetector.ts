// Utility to detect current occasion based on date
// Supports: Ramadan, Islamic holidays, Algerian national holidays, school seasons, Amazigh New Year, etc.

export type OccasionType = 
  | 'ramadan'
  | 'eid_fitr'
  | 'eid_adha'
  | 'mawlid'
  | 'islamic_new_year'
  | 'independence_day'
  | 'revolution_day'
  | 'martyrs_day'
  | 'youth_day'
  | 'amazigh_new_year'
  | 'knowledge_day'
  | 'teacher_day'
  | 'school_start'
  | 'school_end'
  | 'winter_vacation'
  | 'spring_vacation'
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'default';

export interface Occasion {
  type: OccasionType;
  name: string;
  nameAr: string;
  priority: number; // Higher priority overrides lower
}

// Approximate Hijri date calculation
function getApproximateHijriDate(date: Date): { year: number; month: number; day: number } {
  const hijriEpoch = new Date(622, 6, 16).getTime();
  const gregorianDays = Math.floor((date.getTime() - hijriEpoch) / (1000 * 60 * 60 * 24));
  const hijriDays = Math.floor(gregorianDays / 0.970224);
  
  const hijriYear = Math.floor(hijriDays / 354.36667) + 1;
  const daysInYear = hijriDays % 354.36667;
  const hijriMonth = Math.floor(daysInYear / 29.5) + 1;
  const hijriDay = Math.floor(daysInYear % 29.5) + 1;
  
  return { year: hijriYear, month: hijriMonth, day: hijriDay };
}

// Check if date is within a range (inclusive)
function isDateInRange(date: Date, startMonth: number, startDay: number, endMonth: number, endDay: number): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  if (startMonth === endMonth) {
    return month === startMonth && day >= startDay && day <= endDay;
  }
  
  if (month === startMonth) return day >= startDay;
  if (month === endMonth) return day <= endDay;
  if (startMonth < endMonth) {
    return month > startMonth && month < endMonth;
  }
  // Wrap around year (e.g., Dec to Jan)
  return month > startMonth || month < endMonth;
}

// Algerian National Holidays
function getAlgerianNationalHoliday(date: Date): Occasion | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Independence Day - July 5
  if (month === 7 && day >= 3 && day <= 7) {
    return { type: 'independence_day', name: 'Independence Day', nameAr: 'عيد الاستقلال', priority: 95 };
  }
  
  // Revolution Day - November 1
  if (month === 11 && day >= 1 && day <= 3) {
    return { type: 'revolution_day', name: 'Revolution Day', nameAr: 'عيد الثورة', priority: 95 };
  }
  
  // Martyrs' Day - February 18
  if (month === 2 && day >= 17 && day <= 19) {
    return { type: 'martyrs_day', name: 'Martyrs Day', nameAr: 'يوم الشهيد', priority: 90 };
  }
  
  // Youth Day - July 5 (same as independence but different theme for schools)
  // Already covered by independence day
  
  return null;
}

// Special Days
function getSpecialDay(date: Date): Occasion | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Amazigh New Year - January 12-13 (Yennayer)
  if (month === 1 && day >= 11 && day <= 14) {
    return { type: 'amazigh_new_year', name: 'Amazigh New Year', nameAr: 'رأس السنة الأمازيغية', priority: 85 };
  }
  
  // Knowledge Day - April 16
  if (month === 4 && day >= 15 && day <= 17) {
    return { type: 'knowledge_day', name: 'Knowledge Day', nameAr: 'يوم العلم', priority: 80 };
  }
  
  // Teacher's Day - February 28 (Algeria) or October 5 (World)
  if ((month === 2 && day >= 27 && day <= 28) || (month === 10 && day >= 4 && day <= 6)) {
    return { type: 'teacher_day', name: 'Teacher Day', nameAr: 'يوم المعلم', priority: 80 };
  }
  
  return null;
}

// Islamic Occasions (approximate based on Hijri calendar)
function getIslamicOccasion(date: Date): Occasion | null {
  const hijri = getApproximateHijriDate(date);
  
  // Ramadan - Month 9
  if (hijri.month === 9) {
    return { type: 'ramadan', name: 'Ramadan', nameAr: 'رمضان الكريم', priority: 100 };
  }
  
  // Eid al-Fitr - Month 10, days 1-3
  if (hijri.month === 10 && hijri.day >= 1 && hijri.day <= 5) {
    return { type: 'eid_fitr', name: 'Eid al-Fitr', nameAr: 'عيد الفطر المبارك', priority: 100 };
  }
  
  // Eid al-Adha - Month 12, days 10-13
  if (hijri.month === 12 && hijri.day >= 8 && hijri.day <= 15) {
    return { type: 'eid_adha', name: 'Eid al-Adha', nameAr: 'عيد الأضحى المبارك', priority: 100 };
  }
  
  // Mawlid - Month 3, days 11-13
  if (hijri.month === 3 && hijri.day >= 10 && hijri.day <= 14) {
    return { type: 'mawlid', name: 'Mawlid', nameAr: 'المولد النبوي الشريف', priority: 95 };
  }
  
  // Islamic New Year - Month 1, days 1-3
  if (hijri.month === 1 && hijri.day >= 1 && hijri.day <= 5) {
    return { type: 'islamic_new_year', name: 'Islamic New Year', nameAr: 'رأس السنة الهجرية', priority: 90 };
  }
  
  return null;
}

// School Seasons
function getSchoolSeason(date: Date): Occasion | null {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // School Start - September
  if (month === 9 && day >= 1 && day <= 15) {
    return { type: 'school_start', name: 'School Start', nameAr: 'الدخول المدرسي', priority: 70 };
  }
  
  // School End - June/July
  if ((month === 6 && day >= 15) || (month === 7 && day <= 10)) {
    return { type: 'school_end', name: 'School End', nameAr: 'نهاية السنة الدراسية', priority: 70 };
  }
  
  // Winter Vacation - December 15 to January 5
  if ((month === 12 && day >= 15) || (month === 1 && day <= 5)) {
    return { type: 'winter_vacation', name: 'Winter Vacation', nameAr: 'العطلة الشتوية', priority: 60 };
  }
  
  // Spring Vacation - March/April (approximate)
  if (month === 3 && day >= 20 && day <= 31) {
    return { type: 'spring_vacation', name: 'Spring Vacation', nameAr: 'عطلة الربيع', priority: 60 };
  }
  
  return null;
}

// Seasons
function getSeason(date: Date): Occasion {
  const month = date.getMonth() + 1;
  
  // Winter: December, January, February
  if (month === 12 || month === 1 || month === 2) {
    return { type: 'winter', name: 'Winter', nameAr: 'فصل الشتاء', priority: 10 };
  }
  
  // Spring: March, April, May
  if (month >= 3 && month <= 5) {
    return { type: 'spring', name: 'Spring', nameAr: 'فصل الربيع', priority: 10 };
  }
  
  // Summer: June, July, August
  if (month >= 6 && month <= 8) {
    return { type: 'summer', name: 'Summer', nameAr: 'فصل الصيف', priority: 10 };
  }
  
  // Autumn: September, October, November
  return { type: 'autumn', name: 'Autumn', nameAr: 'فصل الخريف', priority: 10 };
}

// Main function to detect current occasion
export function detectCurrentOccasion(date: Date = new Date()): Occasion {
  const occasions: Occasion[] = [];
  
  // Check Islamic occasions (highest priority)
  const islamicOccasion = getIslamicOccasion(date);
  if (islamicOccasion) occasions.push(islamicOccasion);
  
  // Check national holidays
  const nationalHoliday = getAlgerianNationalHoliday(date);
  if (nationalHoliday) occasions.push(nationalHoliday);
  
  // Check special days
  const specialDay = getSpecialDay(date);
  if (specialDay) occasions.push(specialDay);
  
  // Check school seasons
  const schoolSeason = getSchoolSeason(date);
  if (schoolSeason) occasions.push(schoolSeason);
  
  // Always add current season as fallback
  occasions.push(getSeason(date));
  
  // Return the occasion with highest priority
  occasions.sort((a, b) => b.priority - a.priority);
  return occasions[0];
}

// Get all active occasions (for debugging or display)
export function getAllActiveOccasions(date: Date = new Date()): Occasion[] {
  const occasions: Occasion[] = [];
  
  const islamicOccasion = getIslamicOccasion(date);
  if (islamicOccasion) occasions.push(islamicOccasion);
  
  const nationalHoliday = getAlgerianNationalHoliday(date);
  if (nationalHoliday) occasions.push(nationalHoliday);
  
  const specialDay = getSpecialDay(date);
  if (specialDay) occasions.push(specialDay);
  
  const schoolSeason = getSchoolSeason(date);
  if (schoolSeason) occasions.push(schoolSeason);
  
  occasions.push(getSeason(date));
  
  return occasions.sort((a, b) => b.priority - a.priority);
}
