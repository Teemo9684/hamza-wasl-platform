import { ParentSettings } from "@/components/parent/ParentSettings";
import { useParentDashboard } from "@/components/ParentDashboardLayout";

export const ParentSettingsContent = () => {
  const { children, refreshData } = useParentDashboard();

  return (
    <ParentSettings
      children={children}
      onChildRemoved={refreshData}
    />
  );
};

export default ParentSettingsContent;
