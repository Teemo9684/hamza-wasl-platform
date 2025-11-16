import { z } from "zod";

// Student validation schema
export const studentSchema = z.object({
  national_school_id: z.string()
    .min(1, "الرقم الوطني للتلميذ مطلوب")
    .max(20, "الرقم الوطني يجب أن يكون أقل من 20 حرفاً")
    .regex(/^[a-zA-Z0-9]+$/, "الرقم الوطني يجب أن يحتوي على أحرف وأرقام فقط"),
  full_name: z.string()
    .min(1, "الاسم الكامل مطلوب")
    .max(100, "الاسم يجب أن يكون أقل من 100 حرف"),
  date_of_birth: z.string().optional(),
  grade_level: z.string()
    .min(1, "المستوى الدراسي مطلوب")
    .max(50, "المستوى الدراسي يجب أن يكون أقل من 50 حرفاً"),
  class_section: z.string()
    .max(10, "الفصل يجب أن يكون أقل من 10 أحرف")
    .optional(),
});

// News ticker validation schema
export const newsTickerSchema = z.object({
  title: z.string()
    .min(1, "العنوان مطلوب")
    .max(200, "العنوان يجب أن يكون أقل من 200 حرف"),
  content: z.string()
    .min(1, "المحتوى مطلوب")
    .max(1000, "المحتوى يجب أن يكون أقل من 1000 حرف"),
  icon_type: z.string()
    .min(1, "نوع الأيقونة مطلوب")
    .max(20, "نوع الأيقونة يجب أن يكون أقل من 20 حرفاً"),
  badge_color: z.string()
    .regex(/^bg-\w+-\d{3}$/, "لون الشارة غير صحيح")
    .optional(),
  display_order: z.number()
    .min(0, "ترتيب العرض يجب أن يكون 0 أو أكثر")
    .max(999, "ترتيب العرض يجب أن يكون أقل من 1000"),
  is_active: z.boolean(),
});

// Admin login validation schema
export const adminLoginSchema = z.object({
  email: z.string()
    .email("البريد الإلكتروني غير صحيح")
    .max(255, "البريد الإلكتروني يجب أن يكون أقل من 255 حرفاً"),
  password: z.string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .max(100, "كلمة المرور يجب أن تكون أقل من 100 حرف"),
});

// Teacher login validation schema
export const teacherLoginSchema = z.object({
  email: z.string()
    .email("البريد الإلكتروني غير صحيح")
    .max(255, "البريد الإلكتروني يجب أن يكون أقل من 255 حرفاً"),
  password: z.string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .max(100, "كلمة المرور يجب أن تكون أقل من 100 حرف"),
});

// Parent login validation schema
export const parentLoginSchema = z.object({
  email: z.string()
    .email("البريد الإلكتروني غير صحيح")
    .max(255, "البريد الإلكتروني يجب أن يكون أقل من 255 حرفاً"),
  password: z.string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .max(100, "كلمة المرور يجب أن تكون أقل من 100 حرف"),
});

// Parent registration validation schema
export const parentRegistrationSchema = z.object({
  full_name: z.string()
    .min(1, "الاسم الكامل مطلوب")
    .max(100, "الاسم يجب أن يكون أقل من 100 حرف"),
  email: z.string()
    .email("البريد الإلكتروني غير صحيح")
    .max(255, "البريد الإلكتروني يجب أن يكون أقل من 255 حرفاً"),
  phone: z.string()
    .regex(/^[0-9+\s()-]+$/, "رقم الهاتف يجب أن يحتوي على أرقام فقط")
    .min(10, "رقم الهاتف يجب أن يكون 10 أرقام على الأقل")
    .max(20, "رقم الهاتف يجب أن يكون أقل من 20 رقماً"),
  password: z.string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .max(100, "كلمة المرور يجب أن تكون أقل من 100 حرف"),
  national_school_id: z.string()
    .min(1, "الرقم الوطني للتلميذ مطلوب")
    .max(20, "الرقم الوطني يجب أن يكون أقل من 20 حرفاً")
    .regex(/^[a-zA-Z0-9]+$/, "الرقم الوطني يجب أن يحتوي على أحرف وأرقام فقط"),
});

// Teacher registration validation schema
export const teacherRegistrationSchema = z.object({
  full_name: z.string()
    .min(1, "الاسم الكامل مطلوب")
    .max(100, "الاسم يجب أن يكون أقل من 100 حرف"),
  email: z.string()
    .email("البريد الإلكتروني غير صحيح")
    .max(255, "البريد الإلكتروني يجب أن يكون أقل من 255 حرفاً"),
  subject: z.string()
    .min(1, "المادة مطلوبة")
    .max(100, "المادة يجب أن تكون أقل من 100 حرف"),
  grade_level: z.string()
    .min(1, "المستوى الدراسي مطلوب")
    .max(50, "المستوى الدراسي يجب أن يكون أقل من 50 حرفاً"),
  password: z.string()
    .min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل")
    .max(100, "كلمة المرور يجب أن تكون أقل من 100 حرف"),
});

// Message validation schema
export const messageSchema = z.object({
  subject: z.string()
    .min(1, "الموضوع مطلوب")
    .max(200, "الموضوع يجب أن يكون أقل من 200 حرف"),
  content: z.string()
    .min(1, "المحتوى مطلوب")
    .max(5000, "المحتوى يجب أن يكون أقل من 5000 حرف"),
});

// Attendance notes validation
export const attendanceNotesSchema = z.string()
  .max(1000, "الملاحظات يجب أن تكون أقل من 1000 حرف")
  .optional();

export type StudentFormData = z.infer<typeof studentSchema>;
export type NewsTickerFormData = z.infer<typeof newsTickerSchema>;
export type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
export type TeacherLoginFormData = z.infer<typeof teacherLoginSchema>;
export type ParentLoginFormData = z.infer<typeof parentLoginSchema>;
export type ParentRegistrationFormData = z.infer<typeof parentRegistrationSchema>;
export type TeacherRegistrationFormData = z.infer<typeof teacherRegistrationSchema>;
export type MessageFormData = z.infer<typeof messageSchema>;
