export default async () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase keepalive failed: missing environment variables')

    return new Response('Missing Supabase environment variables', {
      status: 500,
    })
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/keep_alive`,
      {
        method: 'POST',
        headers: {
          apikey: supabaseKey,
          'Content-Type': 'application/json',
        },
        body: '{}',
      },
    )

    if (!response.ok) {
      const errorText = await response.text()

      console.error(
        'Supabase keepalive failed:',
        response.status,
        errorText,
      )

      return new Response('Supabase keepalive failed', {
        status: 500,
      })
    }

    const result = await response.text()

    console.log(
      'Supabase keepalive successful:',
      new Date().toISOString(),
      result,
    )

    return new Response('Supabase keepalive successful', {
      status: 200,
    })
  } catch (error) {
    console.error('Supabase keepalive error:', error)

    return new Response('Supabase keepalive error', {
      status: 500,
    })
  }
}

export const config = {
  schedule: '0 */6 * * *',
}