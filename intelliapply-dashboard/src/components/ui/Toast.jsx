import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const toastTypes = {
    success: {
        icon: CheckCircle,
        title: 'Success',
        barClass: 'bg-emerald-500',
        iconClass: 'text-emerald-500',
    },
    error: {
        icon: XCircle,
        title: 'Error',
        barClass: 'bg-red-500',
        iconClass: 'text-red-500',
    },
    warning: {
        icon: AlertTriangle,
        title: 'Warning',
        barClass: 'bg-amber-500',
        iconClass: 'text-amber-500',
    },
    // --- NEW: Added the 'info' type ---
    info: {
        icon: Info,
        title: 'Info',
        barClass: 'bg-sky-500',
        iconClass: 'text-sky-500',
    },
};

export default function Toast({ notification, onDismiss }) {
    const [isVisible, setIsVisible] = useState(false);
    const { id, type, message } = notification;

    // Default to error style if type is unknown, but handle 'info' correctly
    const toast = toastTypes[type] || toastTypes.info;
    const Icon = toast.icon;

    useEffect(() => {
        // Animate in
        setIsVisible(true);

        // Set a timer to dismiss the toast
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Allow time for fade-out animation before removing from DOM
            setTimeout(() => onDismiss(id), 300);
        }, 5000); // Toast visible for 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [id, onDismiss]);

    const handleDismiss = () => {
        setIsVisible(false);
        setTimeout(() => onDismiss(id), 300);
    };

    return (
        <div
            className={`
                max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
                transition-all duration-300 ease-in-out
                ${isVisible ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'}
            `}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Icon className={`h-6 w-6 ${toast.iconClass}`} aria-hidden="true" />
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-900">{toast.title}</p>
                        <p className="mt-1 text-sm text-gray-500">{message}</p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={handleDismiss}
                            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                        >
                            <span className="sr-only">Close</span>
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
