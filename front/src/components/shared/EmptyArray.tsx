import { Users } from "lucide-react"; // o cualquier icono que uses

interface EmptyArrayProps {
  title?: string;
  subtitle?: string;
}

const EmptyArray = ({
  title = "No hay elementos para mostrar",
  subtitle = "Crea el primer elemento de la lista",
}: EmptyArrayProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full text-gray-500 p-6">
      {/* "w-full max-w-md mx-auto py-10 text-center rounded-2xl border border-gray-200 bg-white/50" */}
      <Users className="w-12 h-12 mb-3 opacity-70" />
      <p className="text-base font-medium text-gray-700">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
    </div>
  );
};

export default EmptyArray;
