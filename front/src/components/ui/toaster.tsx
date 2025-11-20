// src/components/ui/toaster.tsx (o donde tengas el Toaster)
import { useToast } from "@/hooks/useToast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react"; // Usé CheckCircle2 que es más lindo

const iconMap = {
  success: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
  destructive: <AlertCircle className="h-5 w-5 text-red-600" />,
  default: <Info className="h-5 w-5 text-blue-600" />, // Icono por defecto
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({
        id,
        title,
        description,
        action,
        variant,
        ...props
      }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex gap-3 items-start text-left">
              {/* El mt-1 alinea el ícono con la primera línea de texto visualmente */}
              <div className="mt-1 shrink-0">
                {iconMap[variant || "default"]}
              </div>
              <div className="grid gap-1">
                {title && (
                  <ToastTitle className="text-sm font-semibold leading-none">
                    {title}
                  </ToastTitle>
                )}
                {description && (
                  <ToastDescription className="text-sm text-slate-500 dark:text-slate-400 leading-snug">
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
