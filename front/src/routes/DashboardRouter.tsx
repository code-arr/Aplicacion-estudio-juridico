import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import AdminDashboard from "@/pages/AdminDashboard";
import LawyerDashboard from "@/pages/LawyerDashboard";
import ClientDetail from "@/pages/ClientDetail";

const DashboardRouter = () => {
  // obtenés el rol del usuario desde Zustand
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/" />;

  if (user.role === "lawyer") {
    return (
      <Routes>
        <Route path="/" element={<LawyerDashboard />} />
        <Route path="clientes/:id" element={<ClientDetail />} />
      </Routes>
    );
  }

  // admin route...

  return <p>Rol no autorizado</p>; // fallback si el rol no es reconocido
};

export default DashboardRouter;
