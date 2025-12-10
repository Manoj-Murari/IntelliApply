import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../lib/store';
import { Button } from '../ui/Button';
import { Download, ExternalLink, CheckCircle, Edit3 } from 'lucide-react';

export function SuccessView() {
    const { setView, downloadPDF } = useAppStore();
    const [isDownloading, setIsDownloading] = useState(false);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setTimeout(() => setAnimate(true), 100);
    }, []);

    const handleDownload = async () => {
        setIsDownloading(true);
        await downloadPDF();
        setIsDownloading(false);
    };

    return (
        <div className="flex flex-col h-full items-center justify-center p-6 text-center">

            {/* Animation Container */}
            <div className={`transform transition-all duration-700 ease-out mb-10 ${animate ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
                <div className="w-28 h-28 rounded-full bg-[#E8F5E9] flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CheckCircle className="w-14 h-14 text-[#2E7D32]" />
                </div>
                <h2 className="font-serif text-3xl font-bold text-[#1F1F1F] mb-3">Application Ready!</h2>
                <p className="text-[#6B6B6B] text-lg">Detailed resume successfully generated.</p>
            </div>

            {/* Actions (Clustered Vertically) */}
            <div className="flex flex-col w-full max-w-sm gap-4">

                {/* Primary: Download PDF (Huge, Green) */}
                <Button 
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full h-14 text-lg font-bold shadow-md bg-[#2E7D32] hover:bg-[#1b5e20] text-white transition-transform active:scale-[0.98]"
                >
                    <Download className="w-5 h-5 mr-3" />
                    {isDownloading ? "Downloading..." : "Download PDF"}
                </Button>

                {/* Secondary: Open in Editor (Ghost) */}
                <Button
                    variant="secondary"
                    onClick={() => setView('home')}
                    className="w-full h-12 text-[#6B6B6B] border-transparent hover:border-[#E6E4DF] hover:bg-[#F9F8F6]"
                >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Open in Editor
                </Button>
            </div>

        </div>
    );
}
