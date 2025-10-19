import { Frame, Toast as PolarisToast } from "@shopify/polaris";
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ToastMessage {
  id: string;
  content: string;
  error?: boolean;
  duration?: number;
}

interface ToastContextType {
  showToast: (content: string, options?: { error?: boolean; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((content: string, options?: { error?: boolean; duration?: number }) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = {
      id,
      content,
      error: options?.error || false,
      duration: options?.duration || 3000,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, newToast.duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toasts.map((toast) => (
        <Frame key={toast.id}>
          <PolarisToast
            content={toast.content}
            error={toast.error}
            onDismiss={() => dismissToast(toast.id)}
          />
        </Frame>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Utility functions for common toast types
export const toast = {
  success: (content: string, showToast: ToastContextType["showToast"]) => {
    showToast(content, { error: false });
  },
  error: (content: string, showToast: ToastContextType["showToast"]) => {
    showToast(content, { error: true });
  },
  info: (content: string, showToast: ToastContextType["showToast"]) => {
    showToast(content, { error: false });
  },
};
