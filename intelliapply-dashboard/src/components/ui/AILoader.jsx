import React from 'react';
import { Loader2 } from 'lucide-react';

// This component is now reusable for all AI modals
export default function AILoader({ text = "Your AI co-pilot is working..." }) {
    return (
        <div className="text-center p-8">
            <Loader2 className="w-12 h-12 text-sky-500 mx-auto animate-spin" />
            <p className="mt-4 font-semibold text-slate-600">{text}</p>
            <p className="text-sm text-slate-500">This may take a moment.</p>
        </div>
    );
}