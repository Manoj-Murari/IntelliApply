import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

// This component is now reusable for all AI modals
export default function PasteDescription({ onGenerate, buttonText = "Generate" }) {
    const [pastedDesc, setPastedDesc] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (pastedDesc.trim()) onGenerate(pastedDesc);
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <h3 className="font-semibold text-slate-700">No Description Found</h3>
            <p className="text-sm text-slate-500">
                This job was saved without a description. Please paste the
                job description below to use this AI feature.
            </p>
            <textarea
                value={pastedDesc}
                onChange={(e) => setPastedDesc(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full h-48 p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500"
                required
            />
            <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-all"
            >
                <Sparkles className="w-5 h-5" />
                {buttonText}
            </button>
        </form>
    );
}