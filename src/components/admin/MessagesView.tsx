import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useRealtime } from "@/hooks/useRealtime";
import { MessageSquare, User, Clock, Search, Filter, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/utils/formatters";

interface Message {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_name: string;
  recipient_name: string;
  student_name: string;
  sender_id?: string;
  recipient_id?: string;
}

interface GroupedAdminMessage {
  id: string;
  subject: string;
  content: string;
  created_at: string;
  recipient_count: number;
  recipient_names: string[];
  is_group: boolean;
  unread_count: number;
}

interface TeacherMessages {
  teacher_id: string;
  teacher_name: string;
  messages: Message[];
  unreadCount: number;
}

interface AdminGroupMessages {
  id: string; // 'admin-group'
  name: string;
  messages: GroupedAdminMessage[];
  unreadCount: number;
}

export const MessagesView = () => {
  const [messagesByTeacher, setMessagesByTeacher] = useState<TeacherMessages[]>([]);
  const [adminGroupMessages, setAdminGroupMessages] = useState<GroupedAdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"all" | "unread" | "read">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTeachers, setExpandedTeachers] = useState<string[]>([]);

  const handleMessagesChange = useCallback(() => {
    fetchAllMessages();
  }, []);

  useRealtime({
    table: 'messages',
    onChange: handleMessagesChange,
  });

  useEffect(() => {
    fetchAllMessages();
  }, []);

  const fetchAllMessages = async () => {
    try {
      setLoading(true);

      const { data: messages, error } = await supabase
        .from("messages")
        .select(`
          id,
          subject,
          content,
          created_at,
          is_read,
          sender_id,
          recipient_id,
          student_id,
          sender:profiles!messages_sender_id_fkey(full_name),
          recipient:profiles!messages_recipient_id_fkey(full_name),
          student:students(full_name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get admin IDs
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      
      const adminIds = adminRoles?.map((r) => r.user_id) || [];

      const { data: teacherRoles, error: teacherError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "teacher");

      if (teacherError) throw teacherError;

      const teacherIds = teacherRoles?.map((r) => r.user_id) || [];

      const { data: teacherProfiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", teacherIds);

      if (profileError) throw profileError;

      const groupedMessages: { [key: string]: TeacherMessages } = {};
      
      // Group admin messages by subject and timestamp (within 5 seconds = same batch)
      const adminMessageGroups: { [key: string]: GroupedAdminMessage } = {};

      messages?.forEach((msg: any) => {
        const isAdminSender = adminIds.includes(msg.sender_id);
        
        // Check if this is an admin group message (admin sending to multiple recipients)
        if (isAdminSender) {
          // Create a key based on subject and timestamp (rounded to 5 seconds)
          const timestamp = new Date(msg.created_at);
          const roundedTime = Math.floor(timestamp.getTime() / 5000) * 5000;
          const groupKey = `${msg.sender_id}-${msg.subject}-${roundedTime}`;
          
          if (!adminMessageGroups[groupKey]) {
            adminMessageGroups[groupKey] = {
              id: groupKey,
              subject: msg.subject,
              content: msg.content,
              created_at: msg.created_at,
              recipient_count: 0,
              recipient_names: [],
              is_group: false,
              unread_count: 0,
            };
          }
          
          adminMessageGroups[groupKey].recipient_count++;
          if (msg.recipient?.full_name) {
            adminMessageGroups[groupKey].recipient_names.push(msg.recipient.full_name);
          }
          if (!msg.is_read) {
            adminMessageGroups[groupKey].unread_count++;
          }
          
          // Mark as group if more than 1 recipient
          if (adminMessageGroups[groupKey].recipient_count > 1) {
            adminMessageGroups[groupKey].is_group = true;
          }
        }
        
        // Also add to teacher groups for teacher-related messages
        const teacherId = teacherIds.includes(msg.sender_id) 
          ? msg.sender_id 
          : teacherIds.includes(msg.recipient_id) 
          ? msg.recipient_id 
          : null;

        if (teacherId && !isAdminSender) {
          const teacherProfile = teacherProfiles?.find(p => p.id === teacherId);
          const teacherName = teacherProfile?.full_name || "معلم غير معروف";

          if (!groupedMessages[teacherId]) {
            groupedMessages[teacherId] = {
              teacher_id: teacherId,
              teacher_name: teacherName,
              messages: [],
              unreadCount: 0,
            };
          }

          groupedMessages[teacherId].messages.push({
            id: msg.id,
            subject: msg.subject,
            content: msg.content,
            created_at: msg.created_at,
            is_read: msg.is_read,
            sender_name: msg.sender?.full_name || "غير معروف",
            recipient_name: msg.recipient?.full_name || "غير معروف",
            student_name: msg.student?.full_name || "",
            sender_id: msg.sender_id,
            recipient_id: msg.recipient_id,
          });

          if (!msg.is_read) {
            groupedMessages[teacherId].unreadCount++;
          }
        }
      });

      // Convert admin groups to array and sort by date
      const adminGroupsArray = Object.values(adminMessageGroups).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAdminGroupMessages(adminGroupsArray);

      const teachersArray = Object.values(groupedMessages).sort(
        (a, b) => b.unreadCount - a.unreadCount
      );
      setMessagesByTeacher(teachersArray);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error fetching messages:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const allMessages = messagesByTeacher.flatMap(t => t.messages);
    const unread = allMessages.filter(m => !m.is_read).length;
    const adminUnread = adminGroupMessages.reduce((sum, m) => sum + m.unread_count, 0);
    const today = allMessages.filter(m => {
      const date = new Date(m.created_at);
      const now = new Date();
      return date.toDateString() === now.toDateString();
    }).length;
    
    return {
      total: allMessages.length + adminGroupMessages.reduce((sum, m) => sum + m.recipient_count, 0),
      unread: unread + adminUnread,
      today,
      teachers: messagesByTeacher.length,
      adminGroups: adminGroupMessages.length
    };
  }, [messagesByTeacher, adminGroupMessages]);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return messagesByTeacher
      .map(teacher => ({
        ...teacher,
        messages: teacher.messages.filter(message => {
          const matchesStatus = filterStatus === "all" 
            || (filterStatus === "unread" && !message.is_read)
            || (filterStatus === "read" && message.is_read);
          
          const matchesSearch = !searchQuery 
            || message.subject.toLowerCase().includes(searchQuery.toLowerCase())
            || message.content.toLowerCase().includes(searchQuery.toLowerCase())
            || message.sender_name.toLowerCase().includes(searchQuery.toLowerCase())
            || teacher.teacher_name.toLowerCase().includes(searchQuery.toLowerCase());
          
          return matchesStatus && matchesSearch;
        })
      }))
      .filter(teacher => teacher.messages.length > 0);
  }, [messagesByTeacher, filterStatus, searchQuery]);

  // Filtered admin group messages
  const filteredAdminMessages = useMemo(() => {
    return adminGroupMessages.filter(message => {
      const matchesStatus = filterStatus === "all" 
        || (filterStatus === "unread" && message.unread_count > 0)
        || (filterStatus === "read" && message.unread_count === 0);
      
      const matchesSearch = !searchQuery 
        || message.subject.toLowerCase().includes(searchQuery.toLowerCase())
        || message.content.toLowerCase().includes(searchQuery.toLowerCase())
        || message.recipient_names.some(name => name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesStatus && matchesSearch;
    });
  }, [adminGroupMessages, filterStatus, searchQuery]);

  const toggleTeacher = (teacherId: string) => {
    setExpandedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId)
        : [...prev, teacherId]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground">جاري تحميل الرسائل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <MessageSquare className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">إدارة الرسائل</h2>
            <p className="text-sm text-muted-foreground">عرض جميع الرسائل بين الأولياء والأساتذة</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">إجمالي الرسائل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unread}</p>
                <p className="text-xs text-muted-foreground">غير مقروءة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.today}</p>
                <p className="text-xs text-muted-foreground">اليوم</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.teachers}</p>
                <p className="text-xs text-muted-foreground">معلم</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="البحث في الرسائل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 h-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={(value: "all" | "unread" | "read") => setFilterStatus(value)}>
          <SelectTrigger className="w-full sm:w-[160px] h-10">
            <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
            <SelectValue placeholder="تصفية" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل ({stats.total})</SelectItem>
            <SelectItem value="unread">جديدة ({stats.unread})</SelectItem>
            <SelectItem value="read">مقروءة ({stats.total - stats.unread})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Admin Group Messages Section */}
      {filteredAdminMessages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">رسائل الإدارة الجماعية</h3>
            <Badge variant="secondary" className="text-xs">
              {filteredAdminMessages.length} رسالة
            </Badge>
          </div>
          
          <div className="grid gap-3">
            {filteredAdminMessages.map((message) => (
              <Card 
                key={message.id} 
                className={cn(
                  "transition-all",
                  message.is_group && "border-primary/30 bg-gradient-to-r from-primary/5 to-transparent"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{message.subject}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {message.is_group ? (
                          <Badge className="bg-primary/90 text-primary-foreground text-xs">
                            <Users className="h-3 w-3 ml-1" />
                            {message.recipient_count} مستلم
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            إلى: {message.recipient_names[0]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {message.unread_count > 0 && (
                        <Badge className="bg-emerald-500 text-xs">
                          {message.unread_count} جديد
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(message.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/40 rounded-lg p-3">
                    <p className="text-sm text-foreground/90 line-clamp-2">{message.content}</p>
                  </div>
                  
                  {message.is_group && message.recipient_names.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">المستلمون: </span>
                      {message.recipient_names.slice(0, 3).join('، ')}
                      {message.recipient_names.length > 3 && ` و${message.recipient_names.length - 3} آخرين...`}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Messages Section */}
      {filteredTeachers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">محادثات المعلمين والأولياء</h3>
          </div>
        </div>
      )}

      {/* Messages List */}
      {filteredTeachers.length === 0 && filteredAdminMessages.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">لا توجد رسائل</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "لا توجد نتائج مطابقة للبحث" : "لا توجد رسائل حالياً"}
            </p>
          </CardContent>
        </Card>
      ) : filteredTeachers.length > 0 && (
        <div className="space-y-3">
          {filteredTeachers.map((teacher) => {
            const isExpanded = expandedTeachers.includes(teacher.teacher_id);
            const filteredUnread = teacher.messages.filter(m => !m.is_read).length;
            
            return (
              <Collapsible 
                key={teacher.teacher_id} 
                open={isExpanded}
                onOpenChange={() => toggleTeacher(teacher.teacher_id)}
              >
                <div className={cn(
                  "rounded-2xl border bg-card overflow-hidden transition-all duration-200",
                  isExpanded ? "shadow-md" : "shadow-sm hover:shadow-md",
                  filteredUnread > 0 && !isExpanded && "border-primary/30"
                )}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors text-right">
                      <div className="relative shrink-0">
                        <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center",
                          filteredUnread > 0 
                            ? "bg-gradient-to-br from-primary to-primary/70" 
                            : "bg-muted"
                        )}>
                          <User className={cn(
                            "h-6 w-6",
                            filteredUnread > 0 ? "text-primary-foreground" : "text-muted-foreground"
                          )} />
                        </div>
                        {filteredUnread > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                            {filteredUnread > 9 ? '+9' : filteredUnread}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-semibold truncate">{teacher.teacher_name}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {teacher.messages.length} رسالة
                          </span>
                          {filteredUnread > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {filteredUnread} جديدة
                            </Badge>
                          )}
                        </div>
                      </div>

                      <ChevronDown className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )} />
                    </button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t">
                      <ScrollArea className="max-h-[500px]">
                        <div className="p-3 space-y-2">
                          {teacher.messages
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((message) => {
                              const isReply = message.subject?.startsWith('رد:');
                              
                              return (
                                <div
                                  key={message.id}
                                  className={cn(
                                    "rounded-xl border p-3 transition-all",
                                    !message.is_read 
                                      ? "bg-gradient-to-r from-primary/5 to-transparent border-primary/30" 
                                      : "bg-card"
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="font-medium text-sm truncate flex-1">{message.subject}</h4>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {!message.is_read ? (
                                        <Badge className="bg-emerald-500 text-[10px] px-1.5 py-0">جديد</Badge>
                                      ) : isReply ? (
                                        <Badge variant="secondary" className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 text-[10px] px-1.5 py-0">رد</Badge>
                                      ) : null}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
                                    <span>من: {message.sender_name}</span>
                                    <span>•</span>
                                    <span>إلى: {message.recipient_name}</span>
                                    {message.student_name && (
                                      <>
                                        <span>•</span>
                                        <span>الطالب: {message.student_name}</span>
                                      </>
                                    )}
                                  </div>

                                  <div className="bg-muted/40 rounded-lg p-2.5 mb-2">
                                    <p className="text-xs text-foreground/90 line-clamp-2">{message.content}</p>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {formatDateTime(message.created_at)}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </ScrollArea>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
};
