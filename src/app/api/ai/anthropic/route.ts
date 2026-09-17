import { NextResponse } from 'next/server';

/**
 * Anthropic Messages API Server-Side Route Handler
 * Proxies Anthropic API calls server-side in Next.js to bypass
 * browser CORS preflight restrictions while protecting client integrity.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('x-api-key') || request.headers.get('authorization');
    const body = await request.json();
    const apiKey = body.apiKey || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader);

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing Anthropic API key. Provide x-api-key header or apiKey in JSON payload.' },
        { status: 401 }
      );
    }

    const payload = {
      model: body.model || 'claude-3-5-sonnet-20240620',
      max_tokens: body.max_tokens || 2048,
      system: body.system || 'You are an expert database and SQL engineer inside DBC. Return concise, valid SQL or analytical insights.',
      messages: body.messages || [
        { role: 'user', content: body.prompt || 'Hello' }
      ]
    };

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(payload)
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return NextResponse.json(
        { error: `Anthropic API error (${anthropicRes.status}): ${errText}` },
        { status: anthropicRes.status }
      );
    }

    const data = await anthropicRes.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Internal Anthropic Proxy error: ${err.message}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'DBC Anthropic Proxy Gateway',
    description: 'Server-side proxy enabling CORS-free Anthropic Claude calls from browser client.'
  });
}
