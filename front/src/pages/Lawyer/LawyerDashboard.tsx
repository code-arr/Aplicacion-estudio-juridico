/* import { useNavigate } from "react-router-dom"; */
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@components/AppSidebar";

import { mockLawyer } from "@/mocks/mockLawyer";
import Clients from "@components/Clients";
import Cases from "@components/Cases";
import Statistics from "@components/Statistics";
import Settings from "@components/Settings";
import { Navigate, Route, Routes } from "react-router-dom";

const LawyerDashboard = () => {
  /* onAddClient(newClientName.trim(), newClientCaseType.trim());
    setNewClientName('');
    setNewClientCaseType('');
    setIsDialogOpen(false);
    
    toast({
      title: "Cliente agregado",
      description: `${newClientName} ha sido agregado correctamente`
    }); */

  const onLogout = () => {};

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        {/* SideBar */}
        <AppSidebar lawyer={mockLawyer} onLogout={onLogout} />

        {/* Main Content */}
        <main className="flex-1 p-4">
          <Routes>
            <Route path="clients" element={<Clients />} />
            <Route path="cases" element={<Cases />} />
            <Route path="statistics" element={<Statistics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="" element={<Navigate to="clients" replace />} />
          </Routes>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default LawyerDashboard;
