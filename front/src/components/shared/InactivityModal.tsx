// src/components/InactivityModal.tsx
import { useAuthStore } from "@/store/useAuthStore";

const InactivityModal = () => {
  const { showInactivityModal, setShowInactivityModal } = useAuthStore();

  if (!showInactivityModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg text-center max-w-sm">
        <p className="text-lg font-semibold mb-4">¿Seguís ahí?</p>
        <p className="text-sm mb-6">
          Tu sesión se cerrará en 1 minuto por inactividad.
        </p>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowInactivityModal(false)}
        >
          Seguir conectado
        </button>
      </div>
    </div>
  );
};

export default InactivityModal;
