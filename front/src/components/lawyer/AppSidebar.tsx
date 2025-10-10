// src/components/lawyer/AppSidebar.tsx
import { NavLink, useLocation } from "react-router-dom";
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
import { StaticSidebar } from "../ui/staticSidebar";
import type { Lawyer } from "@/types/Lawyer";
import { useState } from "react";
import LogoApp from "@/assets/logos/logo-i&a-2.png";

interface AppSidebarProps {
  lawyer: Lawyer | null;
  onLogout: () => void;
}

const AppSidebar = ({ lawyer, onLogout }: AppSidebarProps) => {
  const { pathname, hash } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Soporta HashRouter y BrowserRouter sin cambiar código
  const currentPath = hash?.startsWith("#/")
    ? hash.slice(1) // "#/dashboard/clients" -> "/dashboard/clients"
    : pathname; // "/dashboard/clients"

  const isActive = (to: string) =>
    currentPath === to || currentPath.startsWith(`${to}/`);
  const menuItems = [
    {
      title: "Mis Clientes",
      url: "clients",
      icon: User,
    },
    {
      title: "Mis Items",
      url: "clientItems",
      icon: Scale,
    },
    {
      title: "Estadisticas",
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
    <StaticSidebar
      className={`sticky top-0 h-screen transition-[max-width] duration-300 ease-in-out border-r border-[hsl(216,12%,15%)] overflow-hidden ${
        collapsed ? "max-w-[72px] items-center" : "max-w-[260px]"
      }`}
      onTransitionEnd={() => {
        // dispara un único “tick” global sin store
        window.dispatchEvent(new CustomEvent("sidebar:transition-end"));
      }}
    >
      <SidebarHeader className="py-6 justify-center items-center flex-row gap-0">
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="focus:outline-none transition-opacity hover:opacity-80 cursor-pointer"
        >
          <div className="law-gradient p-2 rounded-lg">
            {/* <Scale className="h-6 w-6 text-white" /> */}
            <img src={LogoApp} className="h-8 w-8 " alt="" />
          </div>
        </button>

        <div className="min-w-0 overflow-hidden text-start">
          <div
            className={`transition-all duration-300 ease-in-out will-change-[width,opacity]
                    whitespace-nowrap ${
                      collapsed ? "opacity-0 w-0" : "opacity-100 w-[180px] ml-3"
                    }`}
            aria-hidden={collapsed}
          >
            <h2 className="text-lg font-semibold text-[hsl(210,40%,98%)]">
              Estudio Jurídico
            </h2>
            <p className="text-sm text-[hsl(210,40%,98%)]/70">
              Panel de Control
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[hsl(210,40%,98%)]/70">
            {!collapsed && "Navegación"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const to = `/dashboard/${item.url}`;
                const active = isActive(to);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={to}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                          active
                            ? "bg-[hsl(216,12%,15%)]/80 text-[hsl(210,40%,98%)] font-medium"
                            : "text-[hsl(210,40%,98%)] hover:bg-[hsl(216,12%,15%)]/50"
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter
        className={`p-4 border-t border-[hsl(216,12%,15%)] overflow-hidden ${
          collapsed
            ? "flex flex-col items-center justify-between  h-[120px]"
            : ""
        }`}
      >
        {collapsed ? (
          <>
            <Avatar className="h-8 w-8 mb-0 cursor-pointer">
              <AvatarFallback className="bg-[hsl(210,100%,45%)] text-[hsl(210,40%,98%)] text-sm">
                {lawyer?.firstName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="text-[hsl(210,40%,98%)]/70 hover:text-[hsl(210,40%,98%)] hover:bg-[hsl(216,12%,15%)] cursor-pointer"
            >
              Salir
            </Button>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 cursor-pointer">
                <AvatarFallback className="bg-[hsl(210,100%,45%)] text-[hsl(210,40%,98%)] text-sm">
                  {lawyer?.firstName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-[hsl(210,40%,98%)] truncate">
                  {lawyer?.firstName + " " + lawyer?.lastName}
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
              className="text-[hsl(210,40%,98%)]/70 hover:text-[hsl(210,40%,98%)] hover:bg-[hsl(216,12%,15%)] cursor-pointer"
            >
              Salir
            </Button>
          </div>
        )}
      </SidebarFooter>
    </StaticSidebar>
  );
};

export default AppSidebar;
