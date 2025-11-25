-- إصلاح المشاكل الأمنية الإضافية

-- ============================================
-- 1. إضافة متطلب المصادقة لجدول profiles
-- ============================================

CREATE POLICY "Require authentication for profiles"
ON public.profiles
FOR ALL
USING (auth.uid() IS NOT NULL);

-- ============================================
-- 2. تحسين حماية جدول students
-- ============================================

-- حذف السياسة الضعيفة
DROP POLICY IF EXISTS "Require authentication for students" ON public.students;

-- السياسات الأخرى (Admins, Parents, Teachers) كافية وآمنة

-- ============================================
-- 3. تقييد الوصول لجدول user_roles
-- ============================================

-- إضافة سياسة صريحة لمنع التعداد
CREATE POLICY "Prevent role enumeration"
ON public.user_roles
FOR SELECT
USING (
  -- المستخدم يمكنه رؤية دوره فقط
  user_id = auth.uid()
  OR
  -- المسؤولون يمكنهم رؤية كل الأدوار
  has_role(auth.uid(), 'admin')
);

-- ============================================
-- 4. تحسين التحقق من المستلمين في الرسائل
-- ============================================

-- حذف السياسة القديمة وإضافة سياسة محسّنة
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;

CREATE POLICY "Users can send messages to approved users only"
ON public.messages
FOR INSERT
WITH CHECK (
  sender_id = auth.uid()
  AND is_user_approved(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = recipient_id AND is_approved = true
  )
  AND (
    -- المسؤولون يمكنهم إرسال رسائل لأي شخص
    has_role(auth.uid(), 'admin')
    OR
    -- المعلمون يمكنهم إرسال رسائل لأولياء أمور طلابهم
    (has_role(auth.uid(), 'teacher') AND EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN teacher_students ts ON ps.student_id = ts.student_id
      WHERE ts.teacher_id = auth.uid() AND ps.parent_id = recipient_id
    ))
    OR
    -- أولياء الأمور يمكنهم إرسال رسائل لمعلمي أطفالهم
    (has_role(auth.uid(), 'parent') AND EXISTS (
      SELECT 1 FROM teacher_students ts
      JOIN parent_students ps ON ts.student_id = ps.student_id
      WHERE ps.parent_id = auth.uid() AND ts.teacher_id = recipient_id
    ))
  )
);

-- ============================================
-- 5. فصل سياسات grades للمعلمين
-- ============================================

DROP POLICY IF EXISTS "Teachers can manage grades for their students" ON public.grades;

-- قراءة الدرجات
CREATE POLICY "Teachers can view grades for their students"
ON public.grades
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teacher_students
    WHERE teacher_students.student_id = grades.student_id
    AND teacher_students.teacher_id = auth.uid()
  )
);

-- إدخال الدرجات
CREATE POLICY "Teachers can insert grades for their students"
ON public.grades
FOR INSERT
WITH CHECK (
  teacher_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM teacher_students
    WHERE teacher_students.student_id = grades.student_id
    AND teacher_students.teacher_id = auth.uid()
  )
);

-- تعديل الدرجات (فقط التي سجلوها)
CREATE POLICY "Teachers can update their own grades only"
ON public.grades
FOR UPDATE
USING (teacher_id = auth.uid());

-- حذف الدرجات (فقط التي سجلوها)
CREATE POLICY "Teachers can delete their own grades only"
ON public.grades
FOR DELETE
USING (teacher_id = auth.uid());

-- ============================================
-- 6. حماية حقل recorded_by في جدول attendance
-- ============================================

DROP POLICY IF EXISTS "Teachers can manage attendance for their students" ON public.attendance;

-- قراءة سجلات الحضور
CREATE POLICY "Teachers can view attendance for their students"
ON public.attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM teacher_students
    WHERE teacher_students.student_id = attendance.student_id
    AND teacher_students.teacher_id = auth.uid()
  )
);

-- إضافة سجلات الحضور (مع التحقق من recorded_by)
CREATE POLICY "Teachers can record attendance for their students"
ON public.attendance
FOR INSERT
WITH CHECK (
  recorded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM teacher_students
    WHERE teacher_students.student_id = attendance.student_id
    AND teacher_students.teacher_id = auth.uid()
  )
);

-- تعديل سجلات الحضور (فقط التي سجلوها)
CREATE POLICY "Teachers can update their own attendance records"
ON public.attendance
FOR UPDATE
USING (recorded_by = auth.uid());

-- حذف سجلات الحضور (فقط التي سجلوها)
CREATE POLICY "Teachers can delete their own attendance records"
ON public.attendance
FOR DELETE
USING (recorded_by = auth.uid());

-- ============================================
-- 7. إضافة trigger لضمان recorded_by صحيح
-- ============================================

CREATE OR REPLACE FUNCTION public.set_attendance_recorder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- تعيين recorded_by تلقائياً إلى المستخدم الحالي
  NEW.recorded_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_attendance_recorder ON public.attendance;
CREATE TRIGGER ensure_attendance_recorder
BEFORE INSERT OR UPDATE ON public.attendance
FOR EACH ROW
EXECUTE FUNCTION public.set_attendance_recorder();

-- ============================================
-- 8. إضافة trigger لضمان teacher_id صحيح في grades
-- ============================================

CREATE OR REPLACE FUNCTION public.set_grade_teacher()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- تعيين teacher_id تلقائياً إلى المستخدم الحالي عند الإدخال
  IF TG_OP = 'INSERT' THEN
    NEW.teacher_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_grade_teacher ON public.grades;
CREATE TRIGGER ensure_grade_teacher
BEFORE INSERT ON public.grades
FOR EACH ROW
EXECUTE FUNCTION public.set_grade_teacher();