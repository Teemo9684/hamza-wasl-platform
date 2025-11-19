import { Home, Users, MessageSquare, Calendar, Send } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface TeacherSidebarProps {
  unreadCount: number;
}

const menuItems = [
  { title: "نظرة عامة", icon: Home, section: "overview" },
  { title: "التلاميذ", icon: Users, section: "students" },
  { title: "الحضور", icon: Calendar, section: "attendance" },
  { title: "الرسائل", icon: MessageSquare, section: "messages" },
  { title: "رسائل جماعية", icon: Send, section: "groupMessages" },
];

export const TeacherSidebar = ({ unreadCount }: TeacherSidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} style={{ "--sidebar-background": "hsl(var(--background))" } as React.CSSProperties}>
      <SidebarContent className="bg-background border-r shadow-lg">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-4 py-6">
            لوحة المعلم
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton asChild>
                    <a
                      href={`#${item.section}`}
                      className="flex items-center gap-3 hover:bg-muted/50 rounded-lg px-3 py-2 transition-colors relative"
                      onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById(item.section);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <item.icon className="h-5 w-5 text-primary" />
                      <span>{item.title}</span>
                      {item.section === "messages" && unreadCount > 0 && (
                        <span className="absolute left-3 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs">
                          {unreadCount}
                        </span>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
