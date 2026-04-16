import React from 'react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

export const NotificationModal: React.FC = () => {
  const { 
    isOpen, type, title, message, isConfirm, 
    confirmLabel, cancelLabel, onConfirm, onCancel, 
    closeNotification 
  } = useNotificationStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeNotification();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    closeNotification();
  };

  const Icon = {
    info: <Info size={24} className="text-blue-500" />,
    warn: <AlertCircle size={24} className="text-orange-500" />,
    error: <XCircle size={24} className="text-red-500" />,
    success: <CheckCircle2 size={24} className="text-emerald-500" />,
  }[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-panel border-theme rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-theme bg-black/10">
          <div className="flex items-center gap-2">
            {Icon}
            <h2 className="text-sm font-black uppercase tracking-widest text-main">{title}</h2>
          </div>
          {!isConfirm && (
            <button onClick={closeNotification} className="text-muted hover:text-main p-1 rounded-full hover:bg-black/20 transition-all">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="p-6">
          <p className="text-sm text-muted leading-relaxed font-bold uppercase tracking-tight">
            {message}
          </p>
        </div>

        <div className="p-4 border-t border-theme bg-black/10 flex justify-end gap-3">
          {isConfirm ? (
            <>
              <button 
                onClick={handleCancel}
                className="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted hover:text-main hover:bg-black/20 transition-all"
              >
                {cancelLabel}
              </button>
              <button 
                onClick={handleConfirm}
                className={clsx(
                    "px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl active:scale-95",
                    type === 'error' ? "bg-red-600 hover:bg-red-500 shadow-red-900/40" : "bg-orange-600 hover:bg-orange-500 shadow-orange-900/40"
                )}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button 
              onClick={closeNotification}
              className="px-10 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
