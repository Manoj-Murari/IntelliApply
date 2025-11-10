import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resumeContext, jobDescription } = await req.json()
    if (!resumeContext || !jobDescription) {
      throw new Error('Resume context and job description are required.')
    }

    // --- NEW, SPECIALIZED PROMPT FOR INTERVIEW PREP ---
    const prompt = `
    Act as a senior hiring manager preparing to interview a candidate.

    THE CANDIDATE'S RESUME CONTEXT:
    ---
    ${resumeContext}
    ---

    THE JOB DESCRIPTION:
    ---
    ${jobDescription}
    ---

    INSTRUCTIONS:
    1.  Based on the job description, generate a list of 5-7 likely interview questions.
    2.  Include a mix of behavioral questions (e.g., "Tell me about a time when...") and technical questions relevant to the skills listed in the job description.
    3.  For each question, provide 2-3 concise bullet points under a "Key Talking Points" section. These talking points should be tailored advice for the candidate, suggesting how they can connect their specific experiences from their resume to the question being asked.
    4.  Return ONLY a valid JSON object with one key: "interviewPrep".
    5.  The value of "interviewPrep" should be an array of objects. Each object should have two keys: "question" (a string) and "talkingPoints" (an array of strings).
    
    Example Output:
    {
      "interviewPrep": [
        {
          "question": "Tell me about your experience with full-stack development.",
          "talkingPoints": [
            "Mention your 'AI Web Assistant' project, highlighting how you built both the Python backend and the React frontend.",
            "Discuss your skills in API integration, referencing your work with the Gemini API and Firebase SDK."
          ]
        }
      ]
    }
    `

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
      throw new Error('Failed to get a response from the AI model.')
    }

    const geminiData = await geminiResponse.json()
    const prepText = geminiData.candidates[0].content.parts[0].text
    const cleanedText = prepText.trim().replace(/```json/g, '').replace(/```/g, '')
    const prepJson = JSON.parse(cleanedText)


    return new Response(JSON.stringify(prepJson), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
