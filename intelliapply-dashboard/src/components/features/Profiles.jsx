import React, { useState } from 'react';
import { 
    Plus, Edit, Trash2, User, FileText, Briefcase, Link as LinkIcon, 
    Phone, Mail, BarChartHorizontal, UploadCloud, File, Download 
} from 'lucide-react';
import { useStore } from '../../lib/store'; // Import the store

// This is the inner form component
function ProfileForm({ profile: initialProfile, onSave, onCancel }) {
    // --- THIS IS THE FIX ---
    // We select each piece of state individually to prevent loops
    const loading = useStore((state) => state.loading);
    const handleRemoveResume = useStore((state) => state.handleRemoveResume);
    // --- END FIX ---

    const [formData, setFormData] = useState({
        ...initialProfile,
        experience_level: initialProfile.experience_level || 'entry_level'
    });
    
    // State to hold the resume File object
    const [resumeFile, setResumeFile] = useState(null);
    const [fileName, setFileName] = useState('');

    const handleChange = (e) => { 
        const { name, value } = e.target; 
        setFormData(prev => ({ ...prev, [name]: value })); 
    };
    
    // Handle file selection
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                useStore.getState().addNotification('File is too large (Max 5MB)', 'error');
                return;
            }
            setResumeFile(file);
            setFileName(file.name);
        }
    };
    
    // Handle form submission
    const handleSubmit = (e) => { 
        e.preventDefault(); 
        onSave(formData, resumeFile); // Pass the file object up
    };
    
    // Handle file removal
    const onRemoveFile = async () => {
        if (!formData.resume_file_url) {
            // If the file hasn't been uploaded yet, just clear the local state
            setResumeFile(null);
            setFileName('');
            return;
        }
        
        // If the file IS uploaded, call the store action
        await handleRemoveResume(formData);
        // Clear the URL from the local form data
        setFormData(prev => ({ ...prev, resume_file_url: null }));
    };

    // Copied from SearchForm
    const experienceLevels = [
        { value: 'entry_level', label: 'Entry Level' },
        { value: 'mid_level', label: 'Mid Level' },
        { value: 'senior_level', label: 'Senior Level' },
        { value: 'executive', label: 'Executive' },
    ];

    const InputField = ({ id, name, label, placeholder, value, icon, type = "text" }) => {
        const Icon = icon;
        return (
            <div>
                <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <Icon className="w-5 h-5 text-slate-400" />
                    </span>
                    <input type={type} id={id} name={name} value={value || ''} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition" placeholder={placeholder} />
                </div>
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">{initialProfile.id ? 'Edit Profile' : 'Create New Profile'}</h2>
            
            {/* --- Section 1: Core Profile Info --- */}
            <div className="mb-6 border-b border-slate-200 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField id="profile_name" name="profile_name" label="Profile Name" placeholder="e.g., Senior Frontend Developer" value={formData.profile_name} icon={Briefcase} />
                
                <div>
                    <label htmlFor="experience_level" className="block text-sm font-medium text-slate-700 mb-1">Experience Level</label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <BarChartHorizontal className="w-5 h-5 text-slate-400" />
                        </span>
                        <select id="experience_level" name="experience_level" value={formData.experience_level} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition bg-white">
                            {experienceLevels.map(level => ( <option key={level.value} value={level.value}>{level.label}</option> ))}
                        </select>
                    </div>
                </div>
            </div>
            
            {/* --- Section 1.5: Resume File Upload --- */}
            <div className="mb-6 border-b border-slate-200 pb-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Upload Resume (PDF/DOCX, Max 5MB)</h3>
                
                {formData.resume_file_url ? (
                    // Show this if a file is already uploaded
                    <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-md">
                        <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-emerald-600" />
                            <span className="font-medium text-emerald-800">Resume attached</span>
                            <a 
                                href={formData.resume_file_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-sm font-semibold text-sky-600 hover:underline"
                            >
                                (Download)
                            </a>
                        </div>
                        <button
                            type="button"
                            onClick={onRemoveFile}
                            disabled={loading}
                            className="p-2 rounded-md text-red-600 hover:bg-red-100 disabled:opacity-50"
                            title="Remove resume"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ) : (
                    // Show this to upload a new file
                    <div className="flex items-center gap-4">
                        <label 
                            htmlFor="resume_file" 
                            className="flex-1 cursor-pointer flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 rounded-md hover:border-sky-500"
                        >
                            <UploadCloud className="w-6 h-6 text-slate-500" />
                            <div className="text-sm">
                                <span className="font-semibold text-sky-600">
                                    {fileName ? fileName : "Click to upload your resume"}
                                </span>
                                <p className="text-slate-500">{fileName ? "File selected." : "Drag and drop or browse"}</p>
                            </div>
                        </label>
                        <input type="file" id="resume_file" name="resume_file" onChange={handleFileChange} className="sr-only" accept=".pdf,.doc,.docx" />
                        
                        {/* Show remove button if a file is staged but not uploaded */}
                        {fileName && (
                            <button
                                type="button"
                                onClick={onRemoveFile}
                                className="p-2 rounded-md text-red-600 hover:bg-red-100"
                                title="Clear selection"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* --- Section 2: Personal Details for Smart Apply --- */}
            <div className="mb-6 border-b border-slate-200 pb-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Smart Apply Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField id="full_name" name="full_name" label="Full Name" placeholder="Your full name" value={formData.full_name} icon={User} />
                    <InputField id="email" name="email" label="Email Address" placeholder="your.email@example.com" value={formData.email} icon={Mail} type="email" />
                    <InputField id="phone" name="phone" label="Phone Number" placeholder="(123) 456-7890" value={formData.phone} icon={Phone} />
                    <InputField id="linkedin_url" name="linkedin_url" label="LinkedIn Profile URL" placeholder="https://linkedin.com/in/yourprofile" value={formData.linkedin_url} icon={LinkIcon} />
                    <InputField id="portfolio_url" name="portfolio_url" label="Portfolio/Website URL" placeholder="https://yourportfolio.com" value={formData.portfolio_url} icon={LinkIcon} />
                </div>
                 <div className="mt-4">
                    <label htmlFor="professional_summary" className="block text-sm font-medium text-slate-700 mb-1">Professional Summary / Elevator Pitch</label>
                    <textarea id="professional_summary" name="professional_summary" value={formData.professional_summary || ''} onChange={handleChange} rows="4" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition" placeholder="A brief, 2-3 sentence summary of your skills and career goals."></textarea>
                </div>
            </div>

            {/* --- Section 3: Full Resume Context --- */}
            <div className="mb-6">
                <label htmlFor="resume_context" className="block text-sm font-medium text-slate-700 mb-1">
                    <FileText className="w-5 h-5 inline-block mr-2" />
                    Full Resume Context (Paste Text)
                </label>
                <textarea id="resume_context" name="resume_context" value={formData.resume_context || ''} onChange={handleChange} rows="15" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition" placeholder="Paste your detailed resume, including skills, experience, and projects..." required></textarea>
                <p className="text-xs text-slate-500 mt-1">This text is used by the AI for analysis. The file above is just for your reference.</p>
            </div>

            <div className="flex justify-end gap-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md font-semibold hover:bg-slate-300 transition">Cancel</button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="px-4 py-2 bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-700 transition disabled:bg-sky-400 disabled:cursor-not-allowed"
                >
                    {loading ? "Saving..." : "Save Profile"}
                </button>
            </div>
        </form>
    );
}

// This is the main page component
export default function Profiles({ profiles, onSave, onDeleteRequest }) {
    const [editingProfile, setEditingProfile] = useState(null);
    
    // --- THIS IS THE SECOND FIX ---
    // Select the handler function directly from the store
    const handleSaveProfile = useStore((state) => state.handleSaveProfile);
    // --- END FIX ---

    const handleCreateNew = () => {
        setEditingProfile({
            id: null,
            profile_name: '',
            resume_context: '',
            full_name: '',
            email: '',
            phone: '',
            linkedin_url: '',
            portfolio_url: '',
            professional_summary: '',
            experience_level: 'entry_level',
            resume_file_url: null, // Add new field
        });
    };
    
    // Handle save from form
    const onSaveForm = (profileData, file) => {
        handleSaveProfile(profileData, file); // Call store action with file
        setEditingProfile(null);
    };

    if (editingProfile) {
        return <ProfileForm 
            profile={editingProfile} 
            onSave={onSaveForm}
            onCancel={() => setEditingProfile(null)} 
        />;
    }
    
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Your Resume Profiles</h2>
                <button onClick={handleCreateNew} className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-sky-700 transition">
                    <Plus className="w-5 h-5" /> New Profile
                </button>
            </div>
            <div className="grid grid-cols-1 gap-4">
                {profiles.length === 0 && (
                    <div className="text-center py-12 bg-white border-2 border-dashed rounded-lg">
                        <h3 className="text-lg font-medium text-slate-800">No Profiles Found</h3>
                        <p className="text-slate-500 mt-1">Get started by creating your first resume profile.</p>
                    </div>
                )}
                {profiles.map(profile => (
                    <div key={profile.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm transition hover:shadow-md">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <h3 className="font-bold text-lg text-slate-800">{profile.profile_name}</h3>
                                {/* Show if file is attached */}
                                {profile.resume_file_url && (
                                    <a 
                                        href={profile.resume_file_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        title="Download attached resume"
                                        className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold hover:bg-emerald-200"
                                    >
                                        <File className="w-3 h-3" /> Resume Attached
                                    </a>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingProfile(profile)} className="p-2 hover:bg-slate-100 rounded-md text-slate-600 transition">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDeleteRequest(profile.id)} className="p-2 hover:bg-red-50 rounded-md text-red-600 transition">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 line-clamp-3">{profile.resume_context}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}