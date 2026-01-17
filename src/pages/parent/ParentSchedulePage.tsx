import { ParentSchedule } from "@/components/parent/ParentSchedule";
import { useParentDashboard } from "@/components/ParentDashboardLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const ParentScheduleContent = () => {
  const { children, selectedChild, setSelectedChild } = useParentDashboard();

  return (
    <>
      {children.length > 1 && (
        <div className="mb-4">
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="اختر الطفل" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <ParentSchedule selectedChild={selectedChild} children={children} />
    </>
  );
};

export default ParentScheduleContent;
