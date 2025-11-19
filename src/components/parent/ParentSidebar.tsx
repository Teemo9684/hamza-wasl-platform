import { Home, BookOpen, Calendar, MessageSquare, Users } from "lucide-react";
import { NavLink } from "@/components/NavLink";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ParentSidebarProps {
  children: any[];
  selectedChild: string;
  onChildChange: (childId: string) => void;
}

const menuItems = [
  { title: "نظرة عامة", icon: Home, section: "overview" },
  { title: "الحضور", icon: Calendar, section: "attendance" },
  { title: "الواجبات", icon: BookOpen, section: "homework" },
  { title: "المراسلة", icon: MessageSquare, section: "messages" },
];

export const ParentSidebar = ({ children, selectedChild, onChildChange }: ParentSidebarProps) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-60"} style={{ "--sidebar-background": "hsl(var(--background))" } as React.CSSProperties}>
      <SidebarContent className="bg-background border-r shadow-lg">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-4 py-6">
            لوحة الولي
          </SidebarGroupLabel>

          {children.length > 0 && (
            <div className="px-4 mb-4">
              <Select value={selectedChild} onValueChange={onChildChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {children.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {child.full_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.section}>
                  <SidebarMenuButton asChild>
                    <a
                      href={`#${item.section}`}
                      className="flex items-center gap-3 hover:bg-muted/50 rounded-lg px-3 py-2 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        const element = document.getElementById(item.section);
                        element?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      <item.icon className="h-5 w-5 text-primary" />
                      <span>{item.title}</span>
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
