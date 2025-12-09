
import React from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '../../lib/store';

export default function EmptyDashboard() {
  const openAddJobModal = useStore((state) => state.openAddJobModal);

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 min-h-[400px]">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
        <Plus className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">
        Track Your First Application
      </h3>
      <p className="max-w-md text-slate-500 mb-8">
        Add a job you've applied to and use our AI to generate a tailored resume and cover letter.
      </p>
      <button
        onClick={openAddJobModal}
        className="flex items-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
      >
        <Plus className="w-5 h-5" />
        Add Manual Job
      </button>
    </div>
  );
}