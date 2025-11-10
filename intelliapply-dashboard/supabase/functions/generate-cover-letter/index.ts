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
    const { resumeContext, jobDescription, company, title } = await req.json()
    if (!resumeContext || !jobDescription || !company || !title) {
      throw new Error('Resume context, job description, company, and title are required.')
    }

    // --- NEW, SPECIALIZED PROMPT FOR COVER LETTERS ---
    const prompt = `
    Act as an expert career coach and professional writer. Your task is to write a concise, professional, and compelling cover letter.

    MY RESUME CONTEXT:
    ---
    ${resumeContext}
    ---

    THE JOB I AM APPLYING FOR:
    - Company: ${company}
    - Job Title: ${title}
    - Job Description: ${jobDescription}
    ---

    INSTRUCTIONS:
    1.  Write a three-paragraph cover letter.
    2.  The first paragraph should introduce me, state the position I'm applying for, and express genuine enthusiasm for the company.
    3.  The second paragraph should be the core of the letter. Highlight 2-3 of my most relevant skills or projects from my resume and directly connect them to the key requirements in the job description. Use strong, action-oriented language.
    4.  The final paragraph should reiterate my interest and include a clear call to action (e.g., "I am eager to discuss how my skills in...").
    5.  The tone should be professional, confident, and tailored. Do not use generic phrases.
    6.  Return ONLY the text of the cover letter as a single string. Do not include "Subject:", "Dear Hiring Manager,", or any sign-off like "Sincerely,".
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
    const coverLetterText = geminiData.candidates[0].content.parts[0].text

    return new Response(JSON.stringify({ coverLetter: coverLetterText }), {
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
