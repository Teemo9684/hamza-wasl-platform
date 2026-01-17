import { useEffect } from "react";
import { ParentHomework } from "@/components/parent/ParentHomework";
import { useNotifications } from "@/contexts/NotificationContext";

export const ParentHomeworkContent = () => {
  const { clearSection } = useNotifications();

  useEffect(() => {
    clearSection('homework');
  }, [clearSection]);

  return <ParentHomework />;
};

export default ParentHomeworkContent;
