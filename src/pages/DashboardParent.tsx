import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, GraduationCap, BookOpen, Award, Calendar } from "lucide-react";

const DashboardParent = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 animated-bg opacity-10" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="glass-card border-b">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold font-cairo">لوحة تحكم ولي الأمر</h1>
            </div>
            <Button onClick={handleLogout} variant="ghost" className="font-tajawal">
              <LogOut className="ml-2 h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2 font-cairo">مرحباً بك</h2>
            <p className="text-muted-foreground font-tajawal">
              تابع تقدم أبنائك الدراسي من هنا
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <Users className="w-5 h-5 text-primary" />
                  التلاميذ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">3</p>
                <p className="text-sm text-muted-foreground font-tajawal">عدد الأبناء</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  الحضور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">95%</p>
                <p className="text-sm text-muted-foreground font-tajawal">نسبة الحضور</p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-cairo">
                  <Award className="w-5 h-5 text-accent" />
                  المعدل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">16.5</p>
                <p className="text-sm text-muted-foreground font-tajawal">المعدل العام</p>
              </CardContent>
            </Card>
          </div>

          {/* Students List */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold mb-4 font-cairo">قائمة الأبناء</h3>
            <div className="space-y-4">
              {["أحمد محمد", "فاطمة محمد", "عمر محمد"].map((name, index) => (
                <Card key={index} className="glass-card hover-lift">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-bold font-cairo">{name}</h4>
                          <p className="text-sm text-muted-foreground font-tajawal">
                            السنة {["الثالثة", "الرابعة", "الخامسة"][index]}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" className="font-tajawal">
                        عرض التفاصيل
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardParent;
