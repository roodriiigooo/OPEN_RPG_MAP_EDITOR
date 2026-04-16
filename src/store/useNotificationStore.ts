import { create } from 'zustand';

export type NotificationType = 'info' | 'warn' | 'error' | 'success';

export interface Toast {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
}

interface NotificationState {
  // Modal State
  isOpen: boolean;
  type: NotificationType;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  isConfirm: boolean;
  
  // Toast State
  toasts: Toast[];
  
  // Actions
  showToast: (title: string, message: string, type?: NotificationType, duration?: number) => string;
  removeToast: (id: string) => void;
  showAlert: (title: string, message: string, type?: NotificationType) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, options?: { type?: NotificationType, confirmLabel?: string, cancelLabel?: string, onCancel?: () => void }) => void;
  closeNotification: () => void;
  clearAllToasts: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  isOpen: false,
  type: 'info',
  title: '',
  message: '',
  isConfirm: false,
  toasts: [],

  showToast: (title, message, type = 'info', duration = 3000) => {
    const id = typeof crypto?.randomUUID === 'function' 
        ? crypto.randomUUID() 
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const newToast: Toast = { id, title, message, type };
    
    set((state) => ({ 
      toasts: [...state.toasts, newToast] 
    }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },

  showAlert: (title, message, type = 'info') => set({
    isOpen: true,
    title,
    message,
    type,
    isConfirm: false,
    onConfirm: undefined,
    onCancel: undefined
  }),

  showConfirm: (title, message, onConfirm, options) => set({
    isOpen: true,
    title,
    message,
    onConfirm,
    type: options?.type || 'warn',
    confirmLabel: options?.confirmLabel || 'Confirm',
    cancelLabel: options?.cancelLabel || 'Cancel',
    onCancel: options?.onCancel,
    isConfirm: true
  }),

  closeNotification: () => set({ isOpen: false }),

  clearAllToasts: () => set({ toasts: [] }),
}));
