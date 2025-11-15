import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, XCircle, Clock } from "lucide-react";

interface ParentAttendanceProps {
  attendance: any[];
  selectedChild: string;
}

export const ParentAttendance = ({ attendance, selectedChild }: ParentAttendanceProps) => {
  const childAttendance = attendance.filter(a => a.student_id === selectedChild);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'حاضر':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'غائب':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'متأخر':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Calendar className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'حاضر':
        return <Badge className="bg-green-600">حاضر</Badge>;
      case 'غائب':
        return <Badge className="bg-red-600">غائب</Badge>;
      case 'متأخر':
        return <Badge className="bg-yellow-600">متأخر</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">سجل الحضور</h2>
        <p className="text-muted-foreground">متابعة حضور الطالب</p>
      </div>

      {childAttendance.length > 0 ? (
        <div className="grid gap-4">
          {childAttendance.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {getStatusIcon(record.status)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">
                        {new Date(record.date).toLocaleDateString('ar-DZ', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                      {getStatusBadge(record.status)}
                    </div>
                    {record.notes && (
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">ملاحظات:</p>
                        <p className="text-sm">{record.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">لا توجد سجلات حضور حالياً</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
