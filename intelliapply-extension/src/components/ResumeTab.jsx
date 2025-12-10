import { useState } from 'react'
import { useJobStore } from '../stores/useJobStore'
import { useProfileStore } from '../stores/useProfileStore'
import { ragService } from '../services/ragService'
import { FileText, Loader2, AlertTriangle, Check } from 'lucide-react'

export function ResumeTab() {
    const { currentJob, generatedResume, setGeneratedResume } = useJobStore()
    const { profiles } = useProfileStore()

    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState('ideal') // 'ideal', 'gaps', 'final'
    const [gaps, setGaps] = useState(null)
    const [answers, setAnswers] = useState({})

    const startGeneration = async () => {
        if (!currentJob || profiles.length === 0) return
        setLoading(true)
        try {
            // 1. Generate Context
            const context = ragService.generateContext(currentJob.description, profiles)

            // 2. Analyze Gaps
            const gapAnalysis = await ragService.analyzeGaps(context)
            setGaps(gapAnalysis)
            setStep('gaps')
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const submitGaps = async () => {
        setLoading(true)
        try {
            // 3. Generate Final
            const context = ragService.generateContext(currentJob.description, profiles)
            const resume = await ragService.generateResume(context, answers)
            setGeneratedResume(resume)
            setStep('final')
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    if (!currentJob) {
        return (
            <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
                <p>Please select or scrape a job in the <b>Job Tab</b> first.</p>
            </div>
        )
    }

    if (profiles.length === 0) {
        return (
            <div className="p-8 text-center text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Please upload at least one resume in the <b>Profile Tab</b>.</p>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-4">
            <h2 className="text-xl font-bold">Resume Maker</h2>

            {/* Job Context */}
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                Target: <b>{currentJob.title}</b> at {currentJob.company}
            </div>

            {step === 'ideal' && (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Ready to generate a tailored resume using {profiles.length} profile(s).
                    </p>
                    <button
                        onClick={startGeneration}
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <FileText />}
                        Generate Resume
                    </button>
                </div>
            )}

            {step === 'gaps' && gaps && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Gap Analysis
                        </h3>
                        <p className="text-sm text-gray-700 mb-3">{gaps.question}</p>

                        {gaps.missingSkills.map(skill => (
                            <div key={skill} className="mb-2">
                                <label className="flex items-center gap-2 text-sm font-medium">
                                    <input
                                        type="checkbox"
                                        checked={answers[skill] || false}
                                        onChange={e => setAnswers({ ...answers, [skill]: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    I have experience with {skill}
                                </label>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={submitGaps}
                        disabled={loading}
                        className="w-full py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <Check />}
                        Continue Generation
                    </button>
                </div>
            )}

            {step === 'final' && generatedResume && (
                <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-green-700">Resume Generated!</h3>
                        <button className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">Download PDF</button>
                    </div>
                    <div className="bg-white border rounded p-3 text-xs font-mono h-[300px] overflow-auto whitespace-pre-wrap">
                        {generatedResume}
                    </div>
                    <button onClick={() => setStep('ideal')} className="w-full text-blue-600 text-sm hover:underline">Start Over</button>
                </div>
            )}
        </div>
    )
}
