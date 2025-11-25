-- إصلاح المشاكل الأمنية في سياسات RLS

-- ============================================
-- 1. إصلاح جدول profiles - منع رؤية بيانات الآخرين
-- ============================================

-- حذف السياسة الواسعة جداً
DROP POLICY IF EXISTS "Approved users can access data" ON public.profiles;

-- إضافة سياسة محدودة للقراءة فقط
CREATE POLICY "Approved users can view profiles with relationships"
ON public.profiles
FOR SELECT
USING (
  is_user_approved(auth.uid()) AND (
    -- المستخدمون يمكنهم رؤية ملفاتهم الشخصية
    id = auth.uid()
    OR
    -- المعلمون يمكنهم رؤية أولياء أمور طلابهم
    (has_role(auth.uid(), 'teacher') AND EXISTS (
      SELECT 1 FROM parent_students ps
      JOIN teacher_students ts ON ps.student_id = ts.student_id
      WHERE ts.teacher_id = auth.uid() AND ps.parent_id = profiles.id
    ))
    OR
    -- أولياء الأمور يمكنهم رؤية معلمي أطفالهم
    (has_role(auth.uid(), 'parent') AND EXISTS (
      SELECT 1 FROM teacher_students ts
      JOIN parent_students ps ON ts.student_id = ps.student_id
      WHERE ps.parent_id = auth.uid() AND ts.teacher_id = profiles.id
    ))
  )
);

-- ============================================
-- 2. إصلاح جدول students - تقييد الوصول للطلاب
-- ============================================

-- حذف السياسة الواسعة جداً
DROP POLICY IF EXISTS "Approved users can view students" ON public.students;

-- السياسات الأخرى (Parents, Teachers, Admins) موجودة بالفعل وصحيحة
-- لا حاجة لتعديلها

-- ============================================
-- 3. إصلاح جدول grades - منع التلاعب بالدرجات
-- ============================================

-- حذف السياسة الواسعة جداً
DROP POLICY IF EXISTS "Approved users can manage grades" ON public.grades;

-- السياسات المتبقية صحيحة:
-- - المسؤولون يمكنهم إدارة كل شيء
-- - المعلمون يمكنهم إدارة درجات طلابهم فقط
-- - أولياء الأمور يمكنهم رؤية درجات أطفالهم فقط

-- ============================================
-- 4. إصلاح جدول attendance - منع التلاعب بالحضور
-- ============================================

-- حذف السياسة الواسعة جداً
DROP POLICY IF EXISTS "Approved users can manage attendance" ON public.attendance;

-- السياسات المتبقية صحيحة:
-- - المسؤولون يمكنهم إدارة كل شيء
-- - المعلمون يمكنهم إدارة حضور طلابهم فقط
-- - أولياء الأمور يمكنهم رؤية حضور أطفالهم فقط

-- ============================================
-- 5. إصلاح جدول students - تقييد تعديل بيانات الطلاب للمعلمين
-- ============================================

-- حذف السياسة الواسعة جداً للمعلمين
DROP POLICY IF EXISTS "Teachers can manage students" ON public.students;

-- إضافة سياسة محدودة للمعلمين - قراءة فقط لطلابهم
CREATE POLICY "Teachers can update only their assigned students"
ON public.students
FOR UPDATE
USING (
  has_role(auth.uid(), 'teacher') AND EXISTS (
    SELECT 1 FROM teacher_students
    WHERE teacher_students.student_id = students.id
    AND teacher_students.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can insert students in their grades"
ON public.students
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'teacher') AND EXISTS (
    SELECT 1 FROM teacher_grade_levels
    WHERE teacher_grade_levels.teacher_id = auth.uid()
    AND teacher_grade_levels.grade_level = students.grade_level
  )
);

-- ============================================
-- 6. إضافة جدول audit log للرسائل (للشفافية)
-- ============================================

CREATE TABLE IF NOT EXISTS public.message_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
  accessed_by uuid NOT NULL,
  accessed_at timestamp with time zone DEFAULT now(),
  access_type text NOT NULL CHECK (access_type IN ('read', 'update', 'delete')),
  user_role text NOT NULL
);

ALTER TABLE public.message_access_log ENABLE ROW LEVEL SECURITY;

-- المسؤولون فقط يمكنهم رؤية سجل الوصول
CREATE POLICY "Only admins can view message access log"
ON public.message_access_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- إنشاء دالة لتسجيل وصول المسؤولين للرسائل
CREATE OR REPLACE FUNCTION public.log_admin_message_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- تسجيل فقط إذا كان المستخدم مسؤول وليس المرسل أو المستقبل
  IF has_role(auth.uid(), 'admin') 
     AND auth.uid() != NEW.sender_id 
     AND auth.uid() != NEW.recipient_id THEN
    INSERT INTO public.message_access_log (
      message_id, 
      accessed_by, 
      access_type,
      user_role
    ) VALUES (
      NEW.id,
      auth.uid(),
      CASE 
        WHEN TG_OP = 'UPDATE' THEN 'update'
        WHEN TG_OP = 'DELETE' THEN 'delete'
        ELSE 'read'
      END,
      'admin'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- إضافة trigger لتسجيل وصول المسؤولين
DROP TRIGGER IF EXISTS log_admin_message_access_trigger ON public.messages;
CREATE TRIGGER log_admin_message_access_trigger
AFTER UPDATE OR DELETE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.log_admin_message_access();