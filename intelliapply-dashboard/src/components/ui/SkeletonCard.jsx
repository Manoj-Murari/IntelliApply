import React from 'react';

export default function SkeletonCard() {
    return (
        <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="animate-pulse flex flex-col space-y-3">
                <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                <div className="flex gap-2 pt-2">
                    <div className="h-5 bg-slate-200 rounded-full w-24"></div>
                    <div className="h-5 bg-slate-200 rounded-full w-24"></div>
                </div>
            </div>
        </div>
    );
}
