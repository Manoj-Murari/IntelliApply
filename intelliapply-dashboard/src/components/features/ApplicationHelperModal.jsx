import React, { useState } from 'react';
import { useStore } from '../../lib/store';
// --- FIX: Add 'ExternalLink' to the list of imports ---
import { X, Clipboard, Check, User, FileText, Briefcase, Link as LinkIcon, Phone, Mail, ExternalLink } from 'lucide-react';

// A reusable component for each piece of data with a copy button
function CopyableField({ label, value, icon }) {
    const [copied, setCopied] = useState(false);
    const addNotification = useStore(state => state.addNotification);

    const handleCopy = () => {
        if (!value) {
            addNotification('Nothing to copy!', 'error');
            return;
        }
        // Use the older document.execCommand for broader compatibility in iFrames
        const textArea = document.createElement("textarea");
        textArea.value = value;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopied(true);
            addNotification(`'${label}' copied to clipboard!`, 'success');
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        } catch (err) {
            addNotification('Failed to copy!', 'error');
        }
        document.body.removeChild(textArea);
    };

    const Icon = icon;

    return (
        <div className="bg-white p-3 rounded-md border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
                <Icon className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <div>
                    <p className="text-xs font-semibold text-slate-500">{label}</p>
                    <p className="text-sm text-slate-800 truncate" title={value}>{value || <span className="text-slate-400">Not provided</span>}</p>
                </div>
            </div>
            <button
                onClick={handleCopy}
                className={`p-2 rounded-md transition-colors ${copied ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                title={`Copy ${label}`}
            >
                {copied ? <Check className="w-5 h-5" /> : <Clipboard className="w-5 h-5" />}
            </button>
        </div>
    );
}


export default function ApplicationHelperModal({ isOpen, onClose, profile, jobUrl }) {
    if (!isOpen || !profile) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-50 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <Briefcase className="w-6 h-6 text-sky-500" />
                        <div>
                           <h2 className="text-xl font-bold text-slate-800">Application Helper</h2>
                           <p className="text-sm text-slate-500">Using profile: {profile.profile_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    <CopyableField label="Full Name" value={profile.full_name} icon={User} />
                    <CopyableField label="Email Address" value={profile.email} icon={Mail} />
                    <CopyableField label="Phone Number" value={profile.phone} icon={Phone} />
                    <CopyableField label="LinkedIn URL" value={profile.linkedin_url} icon={LinkIcon} />
                    <CopyableField label="Portfolio/Website URL" value={profile.portfolio_url} icon={LinkIcon} />
                    
                    <div>
                        <label className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-500" />
                            Professional Summary
                        </label>
                        <div className="bg-white p-3 rounded-md border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                            {profile.professional_summary || <span className="text-slate-400">Not provided</span>}
                        </div>
                    </div>
                </div>

                <div className="p-4 mt-auto border-t border-slate-200 bg-white rounded-b-lg flex justify-end">
                    <a 
                        href={jobUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={onClose} // Close the modal when the user proceeds to apply
                        className="flex items-center justify-center gap-2 px-6 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 transition-all"
                    >
                        Proceed to Application <ExternalLink className="w-5 h-5" />
                    </a>
                </div>
            </div>
        </div>
    );
}
