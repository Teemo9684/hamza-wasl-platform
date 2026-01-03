import { format as dateFnsFormat } from "date-fns";
import { ar } from "date-fns/locale";

// Format date with Western numerals (1,2,3) instead of Arabic numerals (١،٢،٣)
export const formatDate = (
  date: Date | string,
  formatStr: string = "PPP",
  includeLocale: boolean = true
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const formatted = dateFnsFormat(dateObj, formatStr, includeLocale ? { locale: ar } : undefined);
  
  // Convert Arabic numerals to Western numerals
  return convertToWesternNumerals(formatted);
};

// Format date using toLocaleDateString with Western numerals
export const formatLocalDate = (
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Use Arabic locale but force Latin numbering system
  const formatted = dateObj.toLocaleDateString("ar-u-nu-latn", options);
  
  return formatted;
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
