import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  Calendar, 
  CheckCircle, 
  Bell,
  ClipboardList,
  Shield,
  Smartphone,
  ArrowRight,
  Home
} from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const features = [
    {
      icon: <Users className="h-12 w-12 text-primary" />,
      title: "إدارة التلاميذ",
      description: "نظام شامل لإدارة بيانات التلاميذ والأقسام والمعلومات الدراسية بشكل منظم وآمن"
    },
    {
      icon: <CheckCircle className="h-12 w-12 text-primary" />,
      title: "تتبع الحضور",
      description: "تسجيل ومتابعة حضور وغياب التلاميذ بشكل يومي مع إمكانية إضافة ملاحظات وتقارير مفصلة"
    },
    {
      icon: <BookOpen className="h-12 w-12 text-primary" />,
      title: "إدارة الواجبات",
      description: "إضافة وتوزيع الواجبات المنزلية على التلاميذ مع إمكانية إرفاق ملفات متعددة ومتابعة التسليم"
    },
    {
      icon: <ClipboardList className="h-12 w-12 text-primary" />,
      title: "سجل الدرجات",
      description: "متابعة دقيقة لدرجات التلاميذ في جميع المواد والاختبارات مع إمكانية إضافة ملاحظات تقييمية"
    },
    {
      icon: <MessageSquare className="h-12 w-12 text-primary" />,
      title: "التواصل المباشر",
      description: "نظام رسائل فوري بين الأولياء والمعلمين للاستفسار عن تقدم الأبناء والتواصل بشكل فعال"
    },
    {
      icon: <Bell className="h-12 w-12 text-primary" />,
      title: "الإعلانات والأخبار",
      description: "شريط أخبار متحرك يعرض آخر الإعلانات والأحداث المدرسية المهمة لجميع المستخدمين"
    },
    {
      icon: <Calendar className="h-12 w-12 text-primary" />,
      title: "جدول الحصص",
      description: "عرض جدول الحصص الأسبوعي لكل قسم دراسي مع إمكانية تحديثه من قبل الإدارة"
    },
    {
      icon: <Shield className="h-12 w-12 text-primary" />,
      title: "نظام آمن ومعتمد",
      description: "حماية بيانات المستخدمين والتلاميذ بنظام صلاحيات متقدم مع اعتماد إداري للحسابات الجديدة"
    },
    {
      icon: <Smartphone className="h-12 w-12 text-primary" />,
      title: "تطبيق جوال متكامل",
      description: "تطبيق قابل للتثبيت على جميع الأجهزة مع دعم الإشعارات الفورية والعمل دون اتصال"
    }
  ];

  const userTypes = [
    {
      title: "للأولياء",
      description: "متابعة شاملة لأداء أبنائهم الدراسي",
      features: [
        "عرض درجات جميع المواد والاختبارات",
        "متابعة سجل الحضور والغياب",
        "الاطلاع على الواجبات المنزلية",
        "التواصل المباشر مع المعلمين",
        "عرض جدول الحصص الأسبوعي",
        "استقبال الإعلانات والتحديثات الفورية"
      ]
    },
    {
      title: "للمعلمين",
      description: "أدوات متقدمة لإدارة الفصل الدراسي",
      features: [
        "البحث عن التلاميذ والوصول لبياناتهم",
        "تسجيل الحضور والغياب اليومي",
        "إضافة وإدارة الواجبات المنزلية",
        "إدخال الدرجات والملاحظات التقييمية",
        "التواصل مع أولياء الأمور",
        "إرسال رسائل جماعية للأولياء"
      ]
    },
    {
      title: "للإدارة",
      description: "نظام إدارة شامل للمدرسة",
      features: [
        "إدارة حسابات المستخدمين والموافقة عليها",
        "إضافة وتعديل بيانات التلاميذ بالذكاء الاصطناعي",
        "إدارة الأقسام الدراسية وتعيين المعلمين",
        "نشر الإعلانات والأخبار المدرسية",
        "رفع وإدارة جداول الحصص",
        "عرض التقارير والإحصائيات الشاملة"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
      {/* Animated background logos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-white blur-[3px] animate-float"
            style={{
              fontSize: i % 3 === 0 ? '8rem' : i % 3 === 1 ? '6rem' : '4rem',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${20 + i * 3}s`,
              fontFamily: 'Aref Ruqaa'
            }}
          >
            همزة وصل
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-block">
            <div className="relative">
              <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-l from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent"
                  style={{ fontFamily: 'Aref Ruqaa' }}>
                همزة وصل
              </h1>
              <div className="absolute inset-0 bg-gradient-to-l from-primary via-purple-500 to-blue-500 blur-xl opacity-30 animate-pulse"></div>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            المدرسة الابتدائية العربي التبسي
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            جسر التواصل بين المدرسة والبيت
          </p>
          
          <p className="text-lg text-muted-foreground max-w-4xl mx-auto">
            منصة تعليمية متكاملة تربط بين الإدارة والمعلمين وأولياء الأمور لمتابعة شاملة للعملية التعليمية
          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Button size="lg" onClick={() => navigate('/')} className="gap-2">
              <Home className="h-5 w-5" />
              الصفحة الرئيسية
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/install')} className="gap-2">
              <Smartphone className="h-5 w-5" />
              تثبيت التطبيق
            </Button>
          </div>
        </div>

        {/* Main Features */}
        <div className="mb-20">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            مزايا المنصة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="backdrop-blur-sm bg-card/50 border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-center text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* User Types */}
        <div className="mb-20">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            مصمم لجميع المستخدمين
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {userTypes.map((userType, index) => (
              <Card key={index} className="backdrop-blur-sm bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-2xl text-center mb-2">{userType.title}</CardTitle>
                  <CardDescription className="text-center text-base">
                    {userType.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {userType.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <ArrowRight className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Screenshots Section */}
        <div className="mb-20">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            لقطات من التطبيق
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="backdrop-blur-sm bg-card/50 border-border/50 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-center">الصفحة الرئيسية</CardTitle>
                <CardDescription className="text-center">
                  واجهة ترحيبية جميلة مع خيارات التسجيل والدخول لجميع أنواع المستخدمين
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border border-border/50">
                  <img 
                    src="/lovable-uploads/9ee7e896-1c5b-429a-9cda-e9d3a3b91395.png" 
                    alt="الصفحة الرئيسية" 
                    className="w-full h-auto"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-sm bg-card/50 border-border/50 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-center">صفحة التثبيت</CardTitle>
                <CardDescription className="text-center">
                  إرشادات واضحة لتثبيت التطبيق على جميع الأجهزة مع دعم iOS و Android
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg overflow-hidden border border-border/50">
                  <img 
                    src="/lovable-uploads/ff6eb6b3-8bfb-4d8f-a36e-ca81e1e5ca97.png" 
                    alt="صفحة التثبيت" 
                    className="w-full h-auto"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Technical Features */}
        <Card className="backdrop-blur-sm bg-card/50 border-border/50 mb-20">
          <CardHeader>
            <CardTitle className="text-3xl text-center mb-4">المواصفات التقنية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
              <div className="space-y-3">
                <h4 className="font-bold text-xl mb-3 text-primary">الأمان والحماية</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• تشفير البيانات وحماية الخصوصية</li>
                  <li>• نظام صلاحيات متعدد المستويات</li>
                  <li>• اعتماد إداري للحسابات الجديدة</li>
                  <li>• جلسات آمنة ومستمرة</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-xl mb-3 text-primary">الأداء والتوافق</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• تطبيق PWA قابل للتثبيت</li>
                  <li>• دعم كامل لنظامي iOS و Android</li>
                  <li>• إشعارات فورية في الخلفية</li>
                  <li>• تحديثات تلقائية للتطبيق</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-xl mb-3 text-primary">الذكاء الاصطناعي</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• استخراج بيانات التلاميذ من الصور</li>
                  <li>• إدخال تلقائي للبيانات</li>
                  <li>• توفير الوقت والجهد</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-bold text-xl mb-3 text-primary">التصميم</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• واجهة عربية بالكامل (RTL)</li>
                  <li>• تصميم متجاوب لجميع الأجهزة</li>
                  <li>• مظهر عصري جذاب</li>
                  <li>• رسوم متحركة سلسة</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center space-y-6">
          <Card className="backdrop-blur-sm bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl mb-4">ابدأ الآن</CardTitle>
              <CardDescription className="text-lg">
                انضم إلى منصة همزة وصل وكن جزءاً من جسر التواصل بين المدرسة والبيت
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/register')} className="gap-2">
                <Users className="h-5 w-5" />
                إنشاء حساب جديد
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/install')} className="gap-2">
                <Smartphone className="h-5 w-5" />
                تثبيت التطبيق
              </Button>
            </CardContent>
          </Card>

          <p className="text-muted-foreground text-lg">
            مدرسة العربي التبسي 2026
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
