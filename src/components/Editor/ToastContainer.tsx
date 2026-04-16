import React from 'react';
import { useNotificationStore, Toast } from '../../store/useNotificationStore';
import { AlertCircle, CheckCircle2, Info, XCircle, X } from 'lucide-react';

const IconMap = {
  info: <Info size={16} className="text-blue-500" />,
  warn: <AlertCircle size={16} className="text-orange-500" />,
  error: <XCircle size={16} className="text-red-500" />,
  success: <CheckCircle2 size={16} className="text-emerald-500" />,
};

export const ToastContainer: React.FC = () => {
  // Use a stable selector
  const toasts = useNotificationStore((state) => state.toasts);
  const removeToast = useNotificationStore((state) => state.removeToast);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div 
      className="fixed bottom-12 right-6 flex flex-col gap-3 pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      {toasts.map((toast: Toast) => (
        <div 
          key={toast.id}
          className="pointer-events-auto bg-slate-900 border-zinc-800 border-2 rounded-xl shadow-2xl p-4 min-w-[300px] max-w-sm flex items-start gap-3 transition-all duration-300"
          style={{ animation: 'slideIn 0.3s ease-out' }}
        >
          <div className="shrink-0 mt-0.5">
            {IconMap[toast.type] || <Info size={16} className="text-blue-500" />}
          </div>
          <div className="flex-1 space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white">
              {toast.title}
            </h4>
            <p className="text-[10px] text-zinc-400 font-bold leading-tight uppercase tracking-tight">
              {toast.message}
            </p>
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            className="text-zinc-500 hover:text-white transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
