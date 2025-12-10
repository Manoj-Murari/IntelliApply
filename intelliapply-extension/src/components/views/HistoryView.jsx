import React from 'react';
import { useAppStore } from '../../lib/store';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Search, Download, MoreVertical, ArrowLeft } from 'lucide-react';

export function HistoryView() {
    const { setView } = useAppStore();

    // Mock History Data
    const historyItems = [
        { id: 1, role: 'Product Designer', company: 'Google', date: 'Yesterday', initial: 'G' },
        { id: 2, role: 'Frontend Dev', company: 'Airbnb', date: '2 days ago', initial: 'A' },
        { id: 3, role: 'UX Researcher', company: 'Spotify', date: 'Last week', initial: 'S' },
        { id: 4, role: 'Product Manager', company: 'Linear', date: 'Oct 24', initial: 'L' },
        { id: 5, role: 'Design Systems', company: 'Vercel', date: 'Oct 20', initial: 'V' },
    ];

    return (
        <div className="flex flex-col h-full gap-4">

            {/* Header with Back Button */}
            <div className="flex items-center gap-2 mb-2">
                <button
                    onClick={() => setView('home')}
                    className="p-1 rounded-md hover:bg-[#E6E4DF] text-[#6B6B6B]"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-serif text-xl font-bold text-[#1F1F1F]">Application History</h2>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
                <Input placeholder="Search past applications..." className="pl-9 h-10" />
            </div>

            {/* List Container */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {historyItems.map((item) => (
                    <Card key={item.id} className="p-3 flex items-center justify-between hover:bg-[#F9F8F6] cursor-pointer group border-transparent hover:border-[#E6E4DF] border-b-[#F0F0F0]">

                        {/* Left: Logo & Text */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-white border border-[#E6E4DF] flex items-center justify-center text-[#1F1F1F] font-bold font-serif shadow-sm">
                                {item.initial}
                            </div>
                            <div>
                                <h4 className="font-sans font-medium text-[#1F1F1F] text-sm leading-tight group-hover:text-[#D97757] transition-colors">
                                    {item.role}
                                </h4>
                                <p className="text-xs text-[#6B6B6B]">{item.company}</p>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-[#E6E4DF] rounded-md text-[#1F1F1F]" title="Download Again">
                                <Download className="w-4 h-4" />
                            </button>
                            <button className="p-2 hover:bg-[#E6E4DF] rounded-md text-[#1F1F1F]">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>

                    </Card>
                ))}
            </div>

        </div>
    );
}
