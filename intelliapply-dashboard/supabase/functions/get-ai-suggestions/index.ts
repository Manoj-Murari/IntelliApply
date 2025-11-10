import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Get the Gemini API Key from the secrets we already set
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

serve(async (req) => {
  // Set up CORS headers to allow requests from our web app
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Respond to OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the resume and job description from the request body
    const { resumeContext, jobDescription } = await req.json()
    if (!resumeContext || !jobDescription) {
      throw new Error('Both resumeContext and jobDescription are required.')
    }

    // This is the advanced prompt we designed to get high-quality suggestions
    const prompt = `
    Act as an expert career coach. Your task is to help me tailor my resume for a specific job.

    My current resume context is:
    ---
    ${resumeContext}
    ---

    The job description I am applying for is:
    ---
    ${jobDescription}
    ---

    Based on the job description, analyze my resume and provide specific, actionable suggestions for improvement.
    Focus on highlighting relevant skills and experiences.

    Please return ONLY a valid JSON object with one key: "suggestions".
    The value of "suggestions" should be an array of strings, where each string is a specific, well-written bullet point suggestion.
    For example: ["Rephrase 'Managed a team' to 'Led a team of 5 engineers to increase deployment frequency by 30% using Agile methodologies', to better match the leadership skills required.", "Add a bullet point highlighting your experience with 'React' and 'TypeScript' as these are key requirements for the role."]
    `

    // Call the Gemini API
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text()
      console.error(`Gemini API Error: ${geminiResponse.status} ${errorBody}`)
      throw new Error('Failed to get suggestions from the AI model.')
    }

    const geminiData = await geminiResponse.json()
    const suggestionsText = geminiData.candidates[0].content.parts[0].text
    
    // Clean and parse the JSON response from Gemini
    const cleanedText = suggestionsText.trim().replace(/```json/g, '').replace(/```/g, '')
    const suggestionsJson = JSON.parse(cleanedText)

    // Return the successful result to the frontend
    return new Response(JSON.stringify(suggestionsJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Return an error message if anything goes wrong
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
