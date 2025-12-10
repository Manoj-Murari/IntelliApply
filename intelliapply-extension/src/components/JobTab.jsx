import { useState, useEffect } from 'react'
import { useJobStore } from '../stores/useJobStore'
import { RefreshCw, Check, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export function JobTab() {
    const { currentJob, setJob } = useJobStore()
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')
    const [isDuplicate, setIsDuplicate] = useState(false)

    // Check for duplicates whenever URL changes
    useEffect(() => {
        const checkDuplicate = async () => {
            if (!currentJob?.url) return;
            try {
                const { data, error } = await supabase
                    .from('jobs')
                    .select('id')
                    .eq('job_url', currentJob.url)
                    .maybeSingle();

                if (data) {
                    setIsDuplicate(true);
                } else {
                    setIsDuplicate(false);
                }
            } catch (err) {
                console.error("Duplicate check failed:", err);
            }
        };
        checkDuplicate();
    }, [currentJob?.url]);

    const scrape = async () => {
        setLoading(true)
        setMsg('')
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
            if (!tabs[0]) throw new Error('No active tab')

            // Ensure content script is ready (sometimes inject properly if needed, but manifest handles static inject)
            // Send message
            chrome.tabs.sendMessage(tabs[0].id, { action: 'SCRAPE_JOB' }, (response) => {
                if (chrome.runtime.lastError) {
                    setMsg('Error: Refresh the page to enable IntelliApply.')
                    console.error(chrome.runtime.lastError)
                    setLoading(false)
                    return
                }
                if (response) {
                    setJob(response)
                    setMsg('Job scraped successfully!')
                } else {
                    setMsg('No job data found.')
                }
                setLoading(false)
            })
        } catch (e) {
            console.error(e)
            setMsg(e.message)
            setLoading(false)
        }
    }

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold mb-2">Current Job</h2>

            {/* Scrape Controls */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={scrape}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Analyzing...' : 'Analyze Page'}
                </button>
            </div>

            {msg && (
                <div className={`text-sm p-2 rounded ${msg.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {msg}
                </div>
            )}

            {isDuplicate && (
                <div className="flex items-center gap-2 p-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm border border-yellow-200">
                    <AlertCircle className="w-4 h-4" />
                    <span>This job is already in your dashboard.</span>
                </div>
            )}

            {/* Form */}
            <div className="space-y-3">
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Job Title</label>
                    <input
                        type="text"
                        className="w-full text-sm border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={currentJob?.title || ''}
                        onChange={e => setJob({ ...currentJob, title: e.target.value })}
                        placeholder="e.g. Senior React Developer"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
                    <input
                        type="text"
                        className="w-full text-sm border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={currentJob?.company || ''}
                        onChange={e => setJob({ ...currentJob, company: e.target.value })}
                        placeholder="e.g. Google"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                    <textarea
                        className="w-full text-xs border rounded p-2 h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        value={currentJob?.description || ''}
                        onChange={e => setJob({ ...currentJob, description: e.target.value })}
                        placeholder="Paste job description here if scraping fails..."
                    />
                </div>
            </div>
        </div>
    )
}
