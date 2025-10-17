import { AlertTriangle } from "lucide-react";

interface ErrorScreenProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorScreen = ({
  message = "Ocurrió un error al cargar los datos.",
  onRetry,
}: ErrorScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-screen text-red-500">
      <AlertTriangle className="w-12 h-12 mb-3 opacity-80" />
      <p className="text-lg font-semibold mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
};

export default ErrorScreen;
