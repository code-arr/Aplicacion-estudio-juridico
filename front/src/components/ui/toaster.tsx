import { useToast } from "@/hooks/useToast";
import type { ToasterToast } from "@/hooks/useToast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const iconMap = {
  success: <CheckCircle className="h-5 w-5 text-green-600" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
  info: <Info className="h-5 w-5 text-blue-600" />,
  destructive: <AlertCircle className="h-5 w-5 text-red-600" />,
  default: null,
};
export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function (toast: ToasterToast) {
        const { id, title, variant, description, action, ...props } = toast;
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              {iconMap[variant ?? "default"]}
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
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
