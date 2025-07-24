import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import AdminDashboard from "@/pages/AdminDashboard";
import LawyerDashboard from "@/pages/LawyerDashboard";
import ClientDetail from "@/pages/ClientDetail";
import UnauthorizedAccess from "@/components/UnauthorizedAccess";
import LoadingScreen from "@/components/LoadingScreen";

const DashboardRouter = () => {
  console.log("[DEBUG] Ruta actual:", window.location.hash);
  // obtenés el rol del usuario desde Zustand
  const { isLoadingSession, isAdmin, isLawyer } = useAuthStore();

  // Mostrar spinner o nada mientras carga
  if (isLoadingSession) return <LoadingScreen />;

  return (
    <Routes>
      {isLawyer && (
        <>
          <Route path="lawyerDashboard" element={<LawyerDashboard />} />
          <Route
            path="lawyerDashboard/clients/:id"
            element={<ClientDetail />}
          />
        </>
      )}

      {isAdmin && <Route path="adminDashboard" element={<AdminDashboard />} />}

      {/* fallback por si no coincide nada */}
      <Route path="*" element={<UnauthorizedAccess />} />
    </Routes>
  );
};

export default DashboardRouter;
