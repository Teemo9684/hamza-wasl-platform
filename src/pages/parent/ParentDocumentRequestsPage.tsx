import { ParentDocumentRequests } from "@/components/parent/ParentDocumentRequests";
import { useParentDashboard } from "@/components/ParentDashboardLayout";

export const ParentDocumentRequestsContent = () => {
  const { children, selectedChild } = useParentDashboard();

  return (
    <ParentDocumentRequests 
      selectedChild={selectedChild} 
      children={children} 
    />
  );
};

export default ParentDocumentRequestsContent;
