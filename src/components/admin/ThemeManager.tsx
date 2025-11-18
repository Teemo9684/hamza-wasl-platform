import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { themes } from "@/lib/themes";
import { Loader2, CheckCircle2, Sparkles } from "lucide-react";

export const ThemeManager = () => {
  const [activeTheme, setActiveTheme] = useState<string>('default');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchActiveTheme();
  }, []);

  const fetchActiveTheme = async () => {
    try {
      const { data, error } = await supabase
        .from('theme_settings')
        .select('theme_name')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setActiveTheme(data.theme_name);
      }
    } catch (error) {
      console.error('Error fetching active theme:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الثيم الحالي",
        variant: "destructive",
      });
    }
  };

  const activateTheme = async (themeName: string) => {
    setLoading(true);
    try {
      // Deactivate all themes first
      await supabase
        .from('theme_settings')
        .update({ is_active: false })
        .neq('theme_name', '');

      // Check if theme exists
      const { data: existing } = await supabase
        .from('theme_settings')
        .select('id')
        .eq('theme_name', themeName)
        .single();

      if (existing) {
        // Update existing theme
        const { error: updateError } = await supabase
          .from('theme_settings')
          .update({ is_active: true })
          .eq('theme_name', themeName);

        if (updateError) throw updateError;
      } else {
        // Insert new theme
        const { error: insertError } = await supabase
          .from('theme_settings')
          .insert({ theme_name: themeName, is_active: true });

        if (insertError) throw insertError;
      }

      setActiveTheme(themeName);
      
      toast({
        title: "تم تفعيل الثيم",
        description: `تم تفعيل ثيم "${themes[themeName].displayName}" بنجاح. جاري تحديث الصفحة...`,
      });

      // Reload page immediately to apply theme
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error activating theme:', error);
      toast({
        title: "خطأ",
        description: "فشل في تفعيل الثيم",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="font-cairo text-2xl flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          إدارة ثيمات المناسبات
        </CardTitle>
        <CardDescription className="font-cairo">
          اختر ثيم خاص للمناسبات الوطنية والأعياد الدينية
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(themes).map(([key, theme]) => (
            <Card
              key={key}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                activeTheme === key ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: theme.gradients?.primary || `linear-gradient(135deg, hsl(${theme.colors.primary}), hsl(${theme.colors.secondary}))`,
                }}
              />
              <CardHeader>
                <CardTitle className="font-cairo text-lg flex items-center justify-between">
                  {theme.displayName}
                  {activeTheme === key && (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      نشط
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription className="font-cairo text-sm">
                  {theme.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  {[
                    theme.colors.primary,
                    theme.colors.secondary,
                    theme.colors.accent,
                  ].map((color, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: `hsl(${color})` }}
                    />
                  ))}
                </div>
                <Button
                  onClick={() => activateTheme(key)}
                  disabled={loading || activeTheme === key}
                  className="w-full font-cairo"
                  variant={activeTheme === key ? "secondary" : "default"}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : activeTheme === key ? (
                    "الثيم الحالي"
                  ) : (
                    "تفعيل الثيم"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};