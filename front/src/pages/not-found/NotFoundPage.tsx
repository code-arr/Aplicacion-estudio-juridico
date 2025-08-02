// src/pages/NotFoundPage.tsx
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold text-yellow-600">
        Página no encontrada
      </h1>
      <p className="text-gray-600 mt-2">
        La página que estás buscando no existe.
      </p>
      <Button className="mt-4" onClick={() => navigate("/")}>
        Ir al inicio
      </Button>
    </div>
  );
};

export default NotFoundPage;
