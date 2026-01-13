import { format as dateFnsFormat } from "date-fns";
import { ar } from "date-fns/locale";

// أسماء الشهور بالعربية الجزائرية (المغاربية)
const algerianMonths = [
  "جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان",
  "جويلية", "أوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

const algerianMonthsShort = [
  "جان", "فيف", "مار", "أفر", "ماي", "جوا",
  "جوي", "أوت", "سبت", "أكت", "نوف", "ديس"
];

// أسماء الأيام بالعربية
const arabicDays = [
  "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
];

// Convert standard Arabic month names to Algerian month names
const convertToAlgerianMonths = (str: string): string => {
  const standardMonths = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];
  
  let result = str;
  standardMonths.forEach((month, index) => {
    result = result.replace(new RegExp(month, 'g'), algerianMonths[index]);
  });
  
  return result;
};

// Format date with Western numerals (1,2,3) and Algerian month names
export const formatDate = (
  date: Date | string,
  formatStr: string = "PPP",
  includeLocale: boolean = true
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const formatted = dateFnsFormat(dateObj, formatStr, includeLocale ? { locale: ar } : undefined);
  
  // Convert Arabic numerals to Western numerals
  let result = convertToWesternNumerals(formatted);
  
  // Convert to Algerian month names
  result = convertToAlgerianMonths(result);
  
  return result;
};

// Format date using toLocaleDateString with Western numerals and Algerian months
export const formatLocalDate = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Build formatted string manually for full control
  const day = dateObj.getDate();
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();
  const dayOfWeek = dateObj.getDay();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  let result = '';
  
  if (options?.weekday) {
    result += arabicDays[dayOfWeek] + '، ';
  }
  
  result += `${day} ${options?.month === 'short' ? algerianMonthsShort[month] : algerianMonths[month]} ${year}`;
  
  if (options?.hour) {
    result += ` ${hours}:${minutes}`;
  }
  
  return result;
};

// Format date with time (shorthand)
export const formatDateTime = (
  date: Date | string
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const day = dateObj.getDate();
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');
  
  return `${day} ${algerianMonths[month]} ${year} - ${hours}:${minutes}`;
};

// Format date only (shorthand)
export const formatDateOnly = (
  date: Date | string
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const day = dateObj.getDate();
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();
  
  return `${day} ${algerianMonths[month]} ${year}`;
};

// Format date with weekday
export const formatDateWithWeekday = (
  date: Date | string
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const day = dateObj.getDate();
  const month = dateObj.getMonth();
  const year = dateObj.getFullYear();
  const dayOfWeek = dateObj.getDay();
  
  return `${arabicDays[dayOfWeek]}، ${day} ${algerianMonths[month]} ${year}`;
};

// Convert Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) to Western numerals (0123456789)
export const convertToWesternNumerals = (str: string): string => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  
  let result = str;
  
  // Replace Arabic-Indic numerals
  arabicNumerals.forEach((numeral, index) => {
    result = result.replace(new RegExp(numeral, 'g'), index.toString());
  });
  
  // Replace Persian numerals (just in case)
  persianNumerals.forEach((numeral, index) => {
    result = result.replace(new RegExp(numeral, 'g'), index.toString());
  });
  
  return result;
};

// Format number with Western numerals
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

// Get Algerian month name by index (0-11)
export const getAlgerianMonth = (monthIndex: number): string => {
  return algerianMonths[monthIndex % 12];
};

// Get Algerian month short name by index (0-11)
export const getAlgerianMonthShort = (monthIndex: number): string => {
  return algerianMonthsShort[monthIndex % 12];
};