import { create } from 'zustand';

interface ToastMessage {
  id: string;
  tipo: 'success' | 'error' | 'warning' | 'info';
  titulo: string;
  mensaje?: string;
  duracion?: number;
}

interface UIState {
  toasts: ToastMessage[];
  isSidebarOpen: boolean;
  isLoading: boolean;

  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;
  toggleSidebar: () => void;
  setLoading: (loading: boolean) => void;
}

let toastId = 0;

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  isSidebarOpen: false,
  isLoading: false,

  showToast: (toast) => {
    const id = `toast-${++toastId}`;
    const nuevaToast: ToastMessage = {
      ...toast,
      id,
      duracion: toast.duracion ?? 5000,
    };

    set((state) => ({
      toasts: [...state.toasts, nuevaToast],
    }));

    if (nuevaToast.duracion && nuevaToast.duracion > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, nuevaToast.duracion);
    }
  },

  hideToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => set({ toasts: [] }),

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setLoading: (loading: boolean) => set({ isLoading: loading }),
}));

export default useUIStore;