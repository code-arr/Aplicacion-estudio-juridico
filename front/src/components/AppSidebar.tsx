import { NavLink } from "react-router-dom";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Scale, User, Settings, ChartNoAxesCombined } from "lucide-react";
import { StaticSidebar } from "./ui/staticSidebar";
import type { Lawyer } from "@/types/Lawyer";

interface AppSidebarProps {
  lawyer: Lawyer;
  onLogout: () => void;
}

const AppSidebar = ({ lawyer, onLogout }: AppSidebarProps) => {
  const menuItems = [
    {
      title: "Mis Clientes",
      url: "clients",
      icon: User,
    },
    {
      title: "Casos",
      url: "cases",
      icon: Scale,
    },
    {
      title: "Mis Estadisticas",
      url: "statistics",
      icon: ChartNoAxesCombined,
    },
    {
      title: "Configuración",
      url: "settings",
      icon: Settings,
    },
  ];

  return (
    <StaticSidebar className="border-r border-[hsl(216,12%,15%)]">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="law-gradient p-2 rounded-lg">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[hsl(210,40%,98%)]">
              Estudio Jurídico
            </h2>
            <p className="text-sm text-[hsl(210,40%,98%)]/70">
              Panel de Control
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[hsl(210,40%,98%)]/70">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-[hsl(216,12%,15%)] text-[hsl(210,40%,98%)] font-medium"
                            : "text-[hsl(216,12%,8%)] hover:bg-[hsl(216,12%,15%)]/50"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[hsl(216,12%,15%)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[hsl(210,100%,45%)] text-[hsl(210,40%,98%)] text-sm">
                {lawyer.firstname.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-[hsl(210,40%,98%)] truncate">
                {lawyer.firstname + " " + lawyer.lastname}
              </p>
              <p className="text-xs text-[hsl(210,40%,98%)]/70 truncate">
                Abogado
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-[hsl(210,40%,98%)]/70 hover:text-[hsl(210,40%,98%)] hover:bg-[hsl(216,12%,15%)]"
          >
            Salir
          </Button>
        </div>
      </SidebarFooter>
    </StaticSidebar>
  );
};

export default AppSidebar;
