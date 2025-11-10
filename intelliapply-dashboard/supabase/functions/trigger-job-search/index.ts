import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// This is our serverless function
serve(async (req) => {
  // 1. Set up CORS headers to allow requests from our web app
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Respond to OPTIONS requests for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Get the GitHub Personal Access Token from environment variables
    const GITHUB_PAT = Deno.env.get('GITHUB_PAT')
    if (!GITHUB_PAT) {
      throw new Error('GitHub Personal Access Token is not set.')
    }

    // 3. Define the GitHub API endpoint for triggering a workflow
    const GITHUB_OWNER = 'Manoj-Murari' // Your GitHub username
    const GITHUB_REPO = 'ai-job-assistant' // Your backend repository name
    const GITHUB_WORKFLOW_ID = 'main.yml' // The name of your workflow file
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${GITHUB_WORKFLOW_ID}/dispatches`

    // 4. Make the POST request to the GitHub API
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_PAT}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ref: 'main', // The branch to run the workflow on
      }),
    })

    // 5. Check if the request to GitHub was successful
    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`GitHub API Error: ${response.status} ${errorBody}`)
      throw new Error('Failed to trigger the GitHub workflow.')
    }

    // 6. Return a success message to our frontend app
    return new Response(JSON.stringify({ message: 'Successfully triggered the job search workflow!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // 7. Return an error message if anything goes wrong
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
