 import { useState, useEffect } from "react";
 import { Button } from "@/components/ui/button";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Switch } from "@/components/ui/switch";
 import { Badge } from "@/components/ui/badge";
 import { toast } from "sonner";
 import { CloudDownload, Loader2, Sparkles, GitBranch, Tag, Package, CheckCircle, RefreshCw } from "lucide-react";
 import { supabase } from "@/integrations/supabase/client";
 import { APP_VERSION } from "@/config/version";
 import { OTAUpdatesManager } from "./OTAUpdatesManager";
 
 interface GitHubBuildInfo {
   run_number: number;
   created_at: string;
   commit_message: string;
 }
 
 interface LatestVersion {
   version: string;
   created_at: string;
   is_active: boolean;
 }
 
 export const QuickOTADeploy = () => {
   const [fetchingOta, setFetchingOta] = useState(false);
   const [autoOtaVersion, setAutoOtaVersion] = useState("");
   const [autoOtaNotes, setAutoOtaNotes] = useState("");
   const [autoOtaMandatory, setAutoOtaMandatory] = useState(false);
   const [lastBuildInfo, setLastBuildInfo] = useState<GitHubBuildInfo | null>(null);
   const [checkingBuild, setCheckingBuild] = useState(false);
   const [latestVersion, setLatestVersion] = useState<LatestVersion | null>(null);
 
   useEffect(() => {
     checkLatestGitHubBuild();
     fetchLatestVersion();
   }, []);
 
   const checkLatestGitHubBuild = async () => {
     try {
       setCheckingBuild(true);
       const { data, error } = await supabase.functions.invoke('get-apk-download', {
         method: 'POST',
       });
 
       if (!error && data?.success && data?.run) {
         setLastBuildInfo({
           run_number: data.run.run_number,
           created_at: data.run.created_at,
           commit_message: data.run.head_commit || 'تحديث',
         });
         
         if (!autoOtaVersion) {
           setAutoOtaVersion(`1.2.${data.run.run_number}`);
         }
         
         if (!autoOtaNotes && data.run.head_commit) {
           setAutoOtaNotes(data.run.head_commit);
         }
       }
     } catch (error) {
       console.error("Error checking GitHub build:", error);
     } finally {
       setCheckingBuild(false);
     }
   };
 
   const fetchLatestVersion = async () => {
     try {
       const { data, error } = await supabase
         .from("app_versions")
         .select("version, created_at, is_active")
         .eq("is_active", true)
         .order("created_at", { ascending: false })
         .limit(1)
         .maybeSingle();
 
       if (!error && data) {
         setLatestVersion(data);
       }
     } catch (error) {
       console.error("Error fetching latest version:", error);
     }
   };
 
   const handleAutoFetchOta = async () => {
     const versionRegex = /^\d+\.\d+\.\d+$/;
     if (!versionRegex.test(autoOtaVersion)) {
       toast.error("صيغة رقم الإصدار غير صحيحة. استخدم الصيغة: X.X.X");
       return;
     }
 
     try {
       setFetchingOta(true);
       
       const { data, error } = await supabase.functions.invoke('fetch-github-ota', {
         method: 'POST',
         body: { 
           version: autoOtaVersion,
           releaseNotes: autoOtaNotes,
           isMandatory: autoOtaMandatory,
           minAppVersion: "1.0.0"
         },
       });
 
       if (error) throw error;
 
       if (data?.success) {
         toast.success(data.message || "تم إنشاء تحديث OTA بنجاح!");
         setAutoOtaVersion("");
         setAutoOtaNotes("");
         setAutoOtaMandatory(false);
         fetchLatestVersion();
       } else {
         toast.error(data?.message || data?.error || "لم يتم إنشاء التحديث");
       }
     } catch (error) {
       console.error("Error fetching OTA:", error);
       toast.error("فشل في جلب تحديث OTA من GitHub");
     } finally {
       setFetchingOta(false);
     }
   };
 
   return (
     <div className="space-y-6 max-w-4xl mx-auto">
       {/* Quick Deploy Section */}
       <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-accent/10 shadow-lg">
         <CardHeader className="pb-4">
           <CardTitle className="text-xl flex items-center gap-2">
             <Sparkles className="w-5 h-5 text-accent" />
             نشر تحديث OTA تلقائي
             <Badge variant="outline" className="text-xs mr-2">من GitHub</Badge>
           </CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
           {/* GitHub Build Info */}
           {lastBuildInfo && (
             <div className="p-3 rounded-lg bg-muted/50 border border-muted overflow-hidden">
               <div className="flex items-center gap-2 text-sm flex-wrap">
                 <GitBranch className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                 <span className="text-muted-foreground flex-shrink-0">آخر بناء ناجح:</span>
                 <Badge variant="secondary" className="font-mono flex-shrink-0">#{lastBuildInfo.run_number}</Badge>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={checkLatestGitHubBuild}
                   disabled={checkingBuild}
                   className="h-7 px-2"
                 >
                   <RefreshCw className={`h-3 w-3 ${checkingBuild ? 'animate-spin' : ''}`} />
                 </Button>
               </div>
               <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
                 {lastBuildInfo.commit_message}
               </p>
             </div>
           )}
 
           <div className="grid gap-4 md:grid-cols-2">
             <div className="space-y-2">
               <Label className="flex items-center gap-2">
                 <Tag className="w-4 h-4" />
                 رقم الإصدار الجديد
               </Label>
               <Input
                 type="text"
                 value={autoOtaVersion}
                 onChange={(e) => setAutoOtaVersion(e.target.value)}
                 placeholder="مثال: 1.2.70"
                 className="text-left ltr font-mono"
                 dir="ltr"
                 disabled={fetchingOta}
               />
             </div>
             <div className="flex items-center gap-3 pt-6">
               <Switch
                 id="otaMandatory"
                 checked={autoOtaMandatory}
                 onCheckedChange={setAutoOtaMandatory}
                 disabled={fetchingOta}
               />
               <Label htmlFor="otaMandatory" className="cursor-pointer">
                 تحديث إجباري
               </Label>
             </div>
           </div>
 
           <div className="space-y-2">
             <Label>ملاحظات التحديث (بالعربية - مختصرة)</Label>
             <Textarea
               value={autoOtaNotes}
               onChange={(e) => setAutoOtaNotes(e.target.value)}
               placeholder="مثال: تحسين الأداء، إصلاح الأخطاء، ميزات جديدة..."
               rows={2}
               disabled={fetchingOta}
               className="text-right"
               dir="rtl"
             />
           </div>
 
           <Button
             onClick={handleAutoFetchOta}
             disabled={fetchingOta || !autoOtaVersion}
             className="w-full bg-accent hover:bg-accent/90"
             size="lg"
           >
             {fetchingOta ? (
               <>
                 <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                 جاري إنشاء التحديث...
               </>
             ) : (
               <>
                 <CloudDownload className="ml-2 h-5 w-5" />
                 إنشاء تحديث OTA تلقائياً
               </>
             )}
           </Button>
           
           <p className="text-xs text-muted-foreground text-center">
             سيتم جلب أحدث نسخة من الموقع المنشور وتحويلها إلى حزمة OTA تلقائياً
           </p>
         </CardContent>
       </Card>
 
       {/* Version Info */}
       <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
         <CardContent className="p-5">
           <div className="flex items-center justify-between flex-wrap gap-4">
             <div className="flex items-center gap-3">
               <div className="p-2.5 bg-primary/20 rounded-xl">
                 <Package className="h-6 w-6 text-primary" />
               </div>
               <div>
                 <h3 className="font-bold text-lg">إصدار التطبيق</h3>
                 <p className="text-sm text-muted-foreground">الإصدار المثبت في الكود</p>
               </div>
             </div>
             <div className="flex items-center gap-3 flex-wrap">
               <Badge variant="secondary" className="text-xl px-5 py-2 font-mono">
                 {APP_VERSION}
               </Badge>
               {latestVersion && latestVersion.version !== APP_VERSION && (
                 <Badge variant="default" className="gap-1">
                   <CheckCircle className="h-3 w-3" />
                   آخر OTA: {latestVersion.version}
                 </Badge>
               )}
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* Full OTA Manager */}
       <OTAUpdatesManager />
     </div>
   );
 };