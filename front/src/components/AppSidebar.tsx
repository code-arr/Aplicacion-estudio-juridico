import { NavLink } from "react-router-dom";
import {
  Sidebar,
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
import { Scale, User, Settings } from "lucide-react";

interface AppSidebarProps {
  lawyerEmail: string;
  onLogout: () => void;
}

const AppSidebar = ({ lawyerEmail, onLogout }: AppSidebarProps) => {
  const menuItems = [
    {
      title: "Mis Clientes",
      url: "/",
      icon: User,
    },
    {
      title: "Casos",
      url: "/casos",
      icon: Scale,
    },
    {
      title: "Configuración",
      url: "/configuracion",
      icon: Settings,
    },
  ];

  const lawyerName = lawyerEmail.split("@")[0];

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-6">
        <div className="flex items-center space-x-3">
          <div className="law-gradient p-2 rounded-lg">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-sidebar-foreground">
              Estudio Jurídico
            </h2>
            <p className="text-sm text-sidebar-foreground/70">
              Panel de Control
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70">
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
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
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

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {lawyerName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {lawyerName}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                Abogado
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          >
            Salir
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
