// src/pages/UnauthorizedAccess.tsx
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const UnauthorizedAccess = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold text-red-600">Acceso no autorizado</h1>
      <p className="text-gray-600 mt-2">
        No tenés permiso para ver esta página.
      </p>
      <Button className="mt-4" onClick={() => navigate("/")}>
        Ir al inicio
      </Button>
    </div>
  );
};

export default UnauthorizedAccess;
