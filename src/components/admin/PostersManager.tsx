import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowUp, ArrowDown, Image, X, Loader2 } from 'lucide-react';
import { formatDateOnly } from '@/utils/formatters';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Poster {
  id: string;
  title: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export const PostersManager = () => {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    imageFile: null as File | null,
    imagePreview: '',
  });

  const fetchPosters = useCallback(async () => {
    const { data, error } = await supabase
      .from('school_posters')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data) {
      setPosters(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosters();

    const channel = supabase
      .channel('admin-posters-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'school_posters',
        },
        () => {
          fetchPosters();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPosters]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)');
        return;
      }
      setFormData({
        ...formData,
        imageFile: file,
        imagePreview: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('يرجى إدخال عنوان الملصق');
      return;
    }

    if (!formData.imageFile) {
      toast.error('يرجى اختيار صورة للملصق');
      return;
    }

    setUploading(true);

    try {
      // Upload image
      const fileExt = formData.imageFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `posters/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(filePath, formData.imageFile);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('posters')
        .getPublicUrl(filePath);

      // Get max display order
      const maxOrder = posters.length > 0 
        ? Math.max(...posters.map(p => p.display_order)) + 1 
        : 0;

      // Insert poster
      const { error: insertError } = await supabase
        .from('school_posters')
        .insert({
          title: formData.title.trim(),
          image_url: urlData.publicUrl,
          display_order: maxOrder,
        });

      if (insertError) {
        throw insertError;
      }

      toast.success('تم إضافة الملصق بنجاح');
      resetForm();
    } catch (error: any) {
      console.error('Error adding poster:', error);
      toast.error(error.message || 'حدث خطأ أثناء إضافة الملصق');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (poster: Poster) => {
    try {
      // Extract file path from URL
      const urlParts = poster.image_url.split('/');
      const filePath = `posters/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      await supabase.storage.from('posters').remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('school_posters')
        .delete()
        .eq('id', poster.id);

      if (error) throw error;

      toast.success('تم حذف الملصق بنجاح');
    } catch (error: any) {
      console.error('Error deleting poster:', error);
      toast.error('حدث خطأ أثناء حذف الملصق');
    }
  };

  const handleMove = async (posterId: string, direction: 'up' | 'down') => {
    const currentIndex = posters.findIndex(p => p.id === posterId);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === posters.length - 1)
    ) {
      return;
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentPoster = posters[currentIndex];
    const swapPoster = posters[swapIndex];

    try {
      await Promise.all([
        supabase
          .from('school_posters')
          .update({ display_order: swapPoster.display_order })
          .eq('id', currentPoster.id),
        supabase
          .from('school_posters')
          .update({ display_order: currentPoster.display_order })
          .eq('id', swapPoster.id),
      ]);

      fetchPosters();
    } catch (error) {
      console.error('Error moving poster:', error);
      toast.error('حدث خطأ أثناء تغيير الترتيب');
    }
  };

  const toggleActive = async (poster: Poster) => {
    try {
      const { error } = await supabase
        .from('school_posters')
        .update({ is_active: !poster.is_active })
        .eq('id', poster.id);

      if (error) throw error;

      toast.success(poster.is_active ? 'تم إخفاء الملصق' : 'تم تفعيل الملصق');
    } catch (error) {
      console.error('Error toggling poster:', error);
      toast.error('حدث خطأ');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', imageFile: null, imagePreview: '' });
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">إدارة الملصقات</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? (
            <>
              <X className="w-4 h-4 ml-2" />
              إلغاء
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 ml-2" />
              إضافة ملصق
            </>
          )}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>ملصق جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">عنوان الملصق</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="أدخل عنوان الملصق"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label>صورة الملصق</Label>
                {formData.imagePreview ? (
                  <div className="relative">
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 left-2"
                      onClick={() => setFormData({ ...formData, imageFile: null, imagePreview: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <Image className="w-12 h-12 text-muted-foreground mb-2" />
                    <span className="text-muted-foreground">اضغط لاختيار صورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <Button type="submit" disabled={uploading} className="w-full">
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    جاري الرفع...
                  </>
                ) : (
                  'إضافة الملصق'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {posters.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Image className="w-16 h-16 mb-4" />
              <p>لا توجد ملصقات بعد</p>
            </CardContent>
          </Card>
        ) : (
          posters.map((poster, index) => (
            <Card key={poster.id} className={!poster.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <img
                    src={poster.image_url}
                    alt={poster.title}
                    className="w-24 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold">{poster.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDateOnly(poster.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={poster.is_active}
                      onCheckedChange={() => toggleActive(poster)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMove(poster.id, 'up')}
                      disabled={index === 0}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMove(poster.id, 'down')}
                      disabled={index === posters.length - 1}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>حذف الملصق</AlertDialogTitle>
                          <AlertDialogDescription>
                            هل أنت متأكد من حذف هذا الملصق؟ لا يمكن التراجع عن هذا الإجراء.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(poster)}>
                            حذف
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
