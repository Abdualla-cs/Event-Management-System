import React from 'react';

export default function ToastContainer({ toasts = [], removeToast = () => { } }) {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    };

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
                <div key={toast.id} className={`${colors[toast.type] || 'bg-blue-500'} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]`}>
                    <span className="flex-1">{toast.message}</span>
                    <button onClick={() => removeToast(toast.id)} className="hover:opacity-80">
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}