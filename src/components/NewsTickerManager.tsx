import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X, MoveUp, MoveDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { newsTickerSchema } from "@/lib/validations";
import { sendNewsTickerNotification } from "@/utils/sendPushNotification";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  icon_type: string;
  badge_color: string;
  is_active: boolean;
  display_order: number;
}

const badgeColors = [
  { value: "bg-red-500", label: "أحمر" },
  { value: "bg-blue-500", label: "أزرق" },
  { value: "bg-green-500", label: "أخضر" },
  { value: "bg-yellow-500", label: "أصفر" },
  { value: "bg-purple-500", label: "بنفسجي" },
  { value: "bg-orange-500", label: "برتقالي" },
  { value: "bg-pink-500", label: "وردي" },
];

const iconTypes = ["جديد", "إعلان", "نصيحة", "تحذير", "مهم", "عاجل"];

export const NewsTickerManager = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    icon_type: "جديد",
    badge_color: "bg-red-500",
    is_active: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchNewsItems();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('news-ticker-manager-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_ticker',
        },
        () => {
          fetchNewsItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNewsItems = async () => {
    const { data, error } = await supabase
      .from("news_ticker")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل تحميل الأخبار",
        variant: "destructive",
      });
      return;
    }

    setNewsItems(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Get display order for validation
      const maxOrder = newsItems.length > 0 
        ? Math.max(...newsItems.map(item => item.display_order))
        : 0;
      
      const dataToValidate = editingId 
        ? { ...formData, display_order: newsItems.find(n => n.id === editingId)?.display_order || 0 }
        : { ...formData, display_order: maxOrder + 1 };

      // Validate form data using zod schema
      const validatedData = newsTickerSchema.parse(dataToValidate);

      if (editingId) {
        const { error } = await supabase
          .from("news_ticker")
          .update({
            title: validatedData.title,
            content: validatedData.content,
            icon_type: validatedData.icon_type,
            badge_color: validatedData.badge_color,
            is_active: validatedData.is_active,
          })
          .eq("id", editingId);

        if (error) {
          toast({
            title: "خطأ",
            description: "فشل تحديث الخبر",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "نجاح",
          description: "تم تحديث الخبر بنجاح",
        });
      } else {
        const { error } = await supabase
          .from("news_ticker")
          .insert([validatedData]);

        if (error) {
          toast({
            title: "خطأ",
            description: "فشل إضافة الخبر",
            variant: "destructive",
          });
          return;
        }

        // Send push notification for new active news
        if (validatedData.is_active) {
          await sendNewsTickerNotification(validatedData.title, validatedData.content);
        }

        toast({
          title: "نجاح",
          description: "تم إضافة الخبر وإرسال الإشعارات بنجاح",
        });
      }

      resetForm();
      fetchNewsItems();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.errors?.[0]?.message || error.message || "فشل حفظ البيانات",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("news_ticker")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل حذف الخبر",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "نجاح",
      description: "تم حذف الخبر بنجاح",
    });

    fetchNewsItems();
  };

  const handleEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      content: item.content,
      icon_type: item.icon_type,
      badge_color: item.badge_color,
      is_active: item.is_active,
    });
    setIsAdding(true);
  };

  const handleMove = async (id: string, direction: "up" | "down") => {
    const currentIndex = newsItems.findIndex(item => item.id === id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === newsItems.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const currentItem = newsItems[currentIndex];
    const swapItem = newsItems[newIndex];

    await supabase
      .from("news_ticker")
      .update({ display_order: swapItem.display_order })
      .eq("id", currentItem.id);

    await supabase
      .from("news_ticker")
      .update({ display_order: currentItem.display_order })
      .eq("id", swapItem.id);

    fetchNewsItems();
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    const { error } = await supabase
      .from("news_ticker")
      .update({ is_active })
      .eq("id", id);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل تحديث الحالة",
        variant: "destructive",
      });
      return;
    }

    fetchNewsItems();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      icon_type: "جديد",
      badge_color: "bg-red-500",
      is_active: true,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-cairo">إدارة الشريط الإخباري</h2>
        <Button
          onClick={() => setIsAdding(!isAdding)}
          className="font-cairo"
        >
          {isAdding ? (
            <>
              <X className="ml-2 h-4 w-4" />
              إلغاء
            </>
          ) : (
            <>
              <Plus className="ml-2 h-4 w-4" />
              إضافة خبر جديد
            </>
          )}
        </Button>
      </div>

      {isAdding && (
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo">
              {editingId ? "تعديل الخبر" : "خبر جديد"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="icon_type" className="font-cairo">
                  نوع التنبيه
                </Label>
                <Select
                  value={formData.icon_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, icon_type: value })
                  }
                >
                  <SelectTrigger className="font-cairo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconTypes.map((type) => (
                      <SelectItem key={type} value={type} className="font-cairo">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="font-cairo">
                  العنوان
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="font-cairo"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="font-cairo">
                  المحتوى
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  className="font-cairo"
                  dir="rtl"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge_color" className="font-cairo">
                  لون الشارة
                </Label>
                <Select
                  value={formData.badge_color}
                  onValueChange={(value) =>
                    setFormData({ ...formData, badge_color: value })
                  }
                >
                  <SelectTrigger className="font-cairo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {badgeColors.map((color) => (
                      <SelectItem key={color.value} value={color.value} className="font-cairo">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded ${color.value}`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label className="font-cairo">نشط</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="font-cairo">
                  <Save className="ml-2 h-4 w-4" />
                  {editingId ? "حفظ التعديلات" : "إضافة"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="font-cairo"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {newsItems.map((item, index) => (
          <Card key={item.id} className={!item.is_active ? "opacity-50" : ""}>
            <CardContent className="p-3 md:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                {/* Move buttons - horizontal on mobile */}
                <div className="flex sm:flex-col gap-1.5 order-2 sm:order-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleMove(item.id, "up")}
                    disabled={index === 0}
                    className="h-8 w-8"
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleMove(item.id, "down")}
                    disabled={index === newsItems.length - 1}
                    className="h-8 w-8"
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 order-1 sm:order-2">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span
                      className={`${item.badge_color} text-white px-2 py-0.5 rounded-full text-xs font-bold font-cairo`}
                    >
                      {item.icon_type}
                    </span>
                    <h3 className="font-bold font-cairo text-sm truncate">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground font-cairo text-sm line-clamp-2">
                    {item.content}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 order-3 justify-end sm:justify-start">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(checked) =>
                      toggleActive(item.id, checked)
                    }
                    className="scale-90"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleEdit(item)}
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
