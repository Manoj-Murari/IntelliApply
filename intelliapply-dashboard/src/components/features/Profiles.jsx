// src/components/features/Profiles.jsx
import React, { useState } from 'react';
import {
  Plus, Edit, Trash2, User, FileText, Briefcase, Link as LinkIcon,
  Phone, Mail, BarChartHorizontal, UploadCloud, File, Loader2
} from 'lucide-react';
import { useStore } from '../../lib/store';
// --- NEW IMPORTS (for Feature 1) ---
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import mammoth from 'mammoth/mammoth.browser';

// --- NEW PDF.js WORKER SETUP ---
// We need to tell pdf.js where to find its worker script.
// This is a standard setup for using it with bundlers like Vite.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();
// --- END NEW ---

const InputField = ({ id, name, label, placeholder, value, icon, type = "text", onChange }) => {
  const Icon = icon;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="w-5 h-5 text-slate-400" />
        </span>
        <input type={type} id={id} name={name} value={value || ''} onChange={onChange} className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition" placeholder={placeholder} />
      </div>
    </div>
  );
};


// This is the inner form component
function ProfileForm({ profile: initialProfile, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    ...initialProfile,
    experience_level: initialProfile.experience_level || 'entry_level'
  });

  // --- MODIFIED (Feature 1) ---
  // This state is now just for showing the file name in the UI
  const [fileName, setFileName] = useState('');
  const addNotification = useStore(state => state.addNotification);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- NEW (Feature 1): Helper to read file as ArrayBuffer ---
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // --- NEW (Feature 1): PDF text extraction logic ---
  const extractTextFromPdf = async (file) => {
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let allText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        allText += textContent.items.map(item => item.str).join(' ') + '\n';
      }
      return allText;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to read PDF file.');
    }
  };

  // --- NEW (Feature 1): DOCX text extraction logic ---
  const extractTextFromDocx = async (file) => {
    try {
      const arrayBuffer = await readFileAsArrayBuffer(file);
      const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting DOCX text:', error);
      throw new Error('Failed to read DOCX file.');
    }
  };

  // --- MODIFIED (Feature 1): handleFileChange now extracts text ---
  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const fileType = file.type;
    setFileName(file.name);

    // Show loading notification
    addNotification('Reading resume file...', 'info');

    try {
      let extractedText = '';
      if (fileType === 'application/pdf') {
        extractedText = await extractTextFromPdf(file);
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
        extractedText = await extractTextFromDocx(file);
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX.');
      }

      // Update the form state with the extracted text
      setFormData(prev => ({ ...prev, resume_context: extractedText }));
      addNotification('Resume text extracted successfully!', 'success');

    } catch (error) {
      addNotification(error.message, 'error');
      setFileName(''); // Clear file name on error
    }
  };
  
  // --- MODIFIED (Feature 1): handleSubmit no longer passes the file ---
  const handleSubmit = (e) => {
    e.preventDefault();
    // We no longer pass `resumeFile`
    onSave(formData);
  };

  // --- MODIFIED (Feature 1): This button just clears the file name ---
  const onRemoveFile = () => {
    setFileName('');
    // Optionally clear the file input
    const fileInput = document.getElementById('resume_file');
    if (fileInput) fileInput.value = '';
  };
  // --- END MODIFICATIONS ---

  const experienceLevels = [
    { value: 'entry_level', label: 'Entry Level' },
    { value: 'mid_level', label: 'Mid Level' },
    { value: 'senior_level', label: 'Senior Level' },
    { value: 'executive', label: 'Executive' },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">{initialProfile.id ? 'Edit Profile' : 'Create New Profile'}</h2>
      
      <div className="mb-6 border-b border-slate-200 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField id="profile_name" name="profile_name" label="Profile Name" placeholder="e.g., Senior Frontend Developer" value={formData.profile_name} icon={Briefcase} type="text" onChange={handleChange} />
        
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
      
      {/* --- MODIFIED (Feature 1): Resume File Upload Section --- */}
      <div className="mb-6 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Upload Resume to Extract Text (PDF/DOCX)</h3>
        
        {/* This section is removed, as we no longer store the file URL */}
        {/* {formData.resume_file_url ? ( ... ) : ( ... )} */}

        <div className="flex items-center gap-4">
          <label
            htmlFor="resume_file"
            className="flex-1 cursor-pointer flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 rounded-md hover:border-sky-500"
          >
            <UploadCloud className="w-6 h-6 text-slate-500" />
            <div className="text-sm">
              <span className="font-semibold text-sky-600">
                {fileName ? fileName : "Click to upload resume for text extraction"}
              </span>
              <p className="text-slate-500">{fileName ? "File selected." : "Drag and drop or browse"}</p>
            </div>
          </label>
          <input type="file" id="resume_file" name="resume_file" onChange={handleFileChange} className="sr-only" accept=".pdf,.doc,.docx" />
          
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
      </div>
      {/* --- END MODIFIED SECTION --- */}

      <div className="mb-6 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Smart Apply Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField id="full_name" name="full_name" label="Full Name" placeholder="Your full name" value={formData.full_name} icon={User} type="text" onChange={handleChange} />
          <InputField id="email" name="email" label="Email Address" placeholder="your.email@example.com" value={formData.email} icon={Mail} type="email" onChange={handleChange} />
          <InputField id="phone" name="phone" label="Phone Number" placeholder="(123) 456-7890" value={formData.phone} icon={Phone} type="text" onChange={handleChange} />
          <InputField id="linkedin_url" name="linkedin_url" label="LinkedIn Profile URL" placeholder="https://linkedin.com/in/yourprofile" value={formData.linkedin_url} icon={LinkIcon} type="text" onChange={handleChange} />
          <InputField id="portfolio_url" name="portfolio_url" label="Portfolio/Website URL" placeholder="https://yourportfolio.com" value={formData.portfolio_url} icon={LinkIcon} type="text" onChange={handleChange} />
        </div>
        <div className="mt-4">
          <label htmlFor="professional_summary" className="block text-sm font-medium text-slate-700 mb-1">Professional Summary / Elevator Pitch</label>
          <textarea id="professional_summary" name="professional_summary" value={formData.professional_summary || ''} onChange={handleChange} rows="4" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition" placeholder="A brief, 2-3 sentence summary of your skills and career goals."></textarea>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="resume_context" className="block text-sm font-medium text-slate-700 mb-1">
          <FileText className="w-5 h-5 inline-block mr-2" />
          Full Resume Context (Paste Text)
        </label>
        <textarea id="resume_context" name="resume_context" value={formData.resume_context || ''} onChange={handleChange} rows="15" className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-sky-500 focus:border-sky-500 transition" placeholder="Paste your detailed resume, or upload a file to populate this field..." required></textarea>
        <p className="text-xs text-slate-500 mt-1">This text is used by the AI for analysis.</p>
      </div>

      <div className="flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 text-slate-800 rounded-md font-semibold hover:bg-slate-300 transition">Cancel</button>
        <button
          type="submit"
          disabled={loading}
          className="w-32 flex items-center justify-center px-4 py-2 bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-700 transition disabled:bg-sky-400 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Profile"}
        </button>
      </div>
    </form>
  );
}

// This is the main page component
export default function Profiles({ profiles, loading, onSave, onDeleteRequest }) {
  const [editingProfile, setEditingProfile] = useState(null);

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
      resume_file_url: null, // This is now deprecated, but we keep it in the object
    });
  };

  // --- MODIFIED (Feature 1): `file` is no longer passed ---
  const onSaveForm = (profileData) => {
    onSave(profileData); // `file` argument removed
    setEditingProfile(null);
  };

  if (editingProfile) {
    return <ProfileForm
      profile={editingProfile}
      onSave={onSaveForm}
      onCancel={() => setEditingProfile(null)}
      loading={loading}
      // `onRemoveResume` prop is removed
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
                
                {/* --- MODIFIED (Feature 1): Remove the "Resume Attached" badge --- */}
                {/* {profile.resume_file_url && ( ... )} */}
                
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