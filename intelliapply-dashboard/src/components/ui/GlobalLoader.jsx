import React from 'react';
import { Loader2 } from 'lucide-react';

export default function GlobalLoader() {
  return (
    <div className="fixed inset-0 bg-slate-100 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-sky-600 animate-spin" />
        <p className="text-lg font-semibold text-slate-700">
          Loading Your Dashboard...
        </p>
      </div>
    </div>
  );
}