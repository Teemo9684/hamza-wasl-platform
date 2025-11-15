import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { useState } from "react";

interface TeacherAttendanceProps {
  students: any[];
  onRecordAttendance: (studentId: string, status: string, notes: string) => Promise<void>;
}

export const TeacherAttendance = ({
  students,
  onRecordAttendance,
}: TeacherAttendanceProps) => {
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [attendance, setAttendance] = useState({
    status: "حاضر",
    notes: "",
  });

  const handleSubmit = async () => {
    if (!selectedStudent) return;
    await onRecordAttendance(selectedStudent, attendance.status, attendance.notes);
    setSelectedStudent("");
    setAttendance({ status: "حاضر", notes: "" });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">تسجيل الحضور</h2>
        <p className="text-muted-foreground">تسجيل حضور وغياب التلاميذ</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            تسجيل حضور اليوم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>اختر التلميذ</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="اختر تلميذ" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.full_name} - {student.grade_level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>حالة الحضور</Label>
            <Select value={attendance.status} onValueChange={(value) => setAttendance({ ...attendance, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="حاضر">حاضر</SelectItem>
                <SelectItem value="غائب">غائب</SelectItem>
                <SelectItem value="غائب بعذر">غائب بعذر</SelectItem>
                <SelectItem value="متأخر">متأخر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>ملاحظات (اختياري)</Label>
            <Textarea
              value={attendance.notes}
              onChange={(e) => setAttendance({ ...attendance, notes: e.target.value })}
              placeholder="أضف ملاحظات إن وجدت"
              rows={3}
            />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!selectedStudent}>
            تسجيل الحضور
          </Button>
        </CardContent>
      </Card>

      {students.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">قم بإضافة تلاميذ لتتمكن من تسجيل الحضور</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
