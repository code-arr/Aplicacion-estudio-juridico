// src/components/admin/AdminSidebar.tsx
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, NavLink } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdminStore } from "@/store/useAdminStore";

function initials(first?: string, last?: string) {
  const a = (first?.[0] ?? "").toUpperCase();
  const b = (last?.[0] ?? "").toUpperCase();
  return a + b || "AD";
}

export default function AdminSidebar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { admin, isHydrated, isLoading, hydrateByUserId } = useAdminStore();

  // Hidratar admin sólo si es rol admin y aún no está cargado
  useEffect(() => {
    if (user?.role === "admin" && user.id && !isHydrated && !isLoading) {
      void hydrateByUserId(user.id);
    }
  }, [user, isHydrated, isLoading, hydrateByUserId]);

  const name = useMemo(
    () => [admin?.firstName, admin?.lastName].filter(Boolean).join(" "),
    [admin]
  );

  return (
    <aside className="h-screen w-64 border-r border-[#e5e7eb] bg-white p-3">
      {/* Header con identidad */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "#f3f4f6", color: "#111827" }}
          aria-label="Admin avatar"
          title={name || "Admin"}
        >
          <span className="text-sm font-semibold">
            {initials(admin?.firstName, admin?.lastName)}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#111827] truncate">
            {name || (isLoading ? "Cargando…" : "Administrador")}
          </div>
          <div className="text-xs text-[#6b7280] truncate">
            {user?.email ?? "—"}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1">
        <NavLink
          to="/dashboard/admin/clients"
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm ${
              isActive ? "bg-[#f3f4f6]" : "hover:bg-[#f9fafb]"
            }`
          }
          end
        >
          Clientes
        </NavLink>

        <NavLink
          to="/dashboard/admin/lawyers"
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm ${
              isActive ? "bg-[#f3f4f6]" : "hover:bg-[#f9fafb]"
            }`
          }
        >
          Abogados
        </NavLink>

        <NavLink
          to="/dashboard/admin/stats"
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm ${
              isActive ? "bg-[#f3f4f6]" : "hover:bg-[#f9fafb]"
            }`
          }
        >
          Estadísticas
        </NavLink>
      </nav>

      {/*       <div className="mt-6">
        <Button
          variant="outline"
          className="w-full border-[#e5e7eb] text-[#111827]"
          onClick={() => navigate("/dashboard/clients")}
        >
          Ir a vista Lawyer
        </Button>
      </div> */}
    </aside>
  );
}
