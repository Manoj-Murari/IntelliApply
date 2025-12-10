import { useState, useEffect } from 'react'
import { useProfileStore } from '../stores/useProfileStore'
import { Upload, FileText, Trash2, CheckCircle } from 'lucide-react'

export function ProfileTab() {
    const { profiles, fetchProfiles, addProfile, isLoading, error } = useProfileStore()
    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        fetchProfiles()
    }, [])

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        setUploading(true)
        try {
            await addProfile(file)
        } catch (err) {
            console.error(err)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold mb-4">Your Resumes</h2>

            {/* Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.docx"
                    onChange={handleFileChange}
                    disabled={uploading || isLoading}
                />
                <label htmlFor="resume-upload" className="cursor-pointer flex flex-col items-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-600">
                        {uploading ? 'Processing...' : 'Upload Resume (PDF/DOCX)'}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                        Files stored locally efficiently
                    </span>
                </label>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-2 bg-red-100 text-red-700 text-sm rounded">
                    {error}
                </div>
            )}

            {/* List */}
            <div className="space-y-2">
                {profiles.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white border rounded shadow-sm">
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <div>
                                <p className="font-medium text-sm truncate max-w-[180px]">{p.filename}</p>
                                <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                ))}
                {profiles.length === 0 && !isLoading && (
                    <p className="text-center text-gray-500 text-sm py-4">No profiles found.</p>
                )}
            </div>
        </div>
    )
}
