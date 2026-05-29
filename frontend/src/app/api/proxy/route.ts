import { NextRequest, NextResponse } from 'next/server';

const SCRIPT_URL = process.env.APPS_SCRIPT_URL!;
const API_SECRET = process.env.API_SECRET || '';

if (!SCRIPT_URL) {
  console.error('❌ APPS_SCRIPT_URL is not set in environment variables');
}

// Handle OPTIONS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const params = new URLSearchParams(request.nextUrl.searchParams);
    if (API_SECRET) params.set('secret', API_SECRET);

    const url = `${SCRIPT_URL}?${params.toString()}`;
    const res  = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Apps Script can be slow, give it 25s
      signal: AbortSignal.timeout(25000),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    if (message.includes('timeout') || message.includes('abort')) {
      return NextResponse.json({ success: false, message: 'Server timeout. Coba lagi.' }, { status: 504 });
    }
    return NextResponse.json({ success: false, message: 'Proxy error: ' + message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: Record<string, unknown> = await request.json();
    if (API_SECRET) body.secret = API_SECRET;

    const res = await fetch(SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(30000),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    if (message.includes('timeout') || message.includes('abort')) {
      return NextResponse.json({ success: false, message: 'Server timeout. Coba lagi.' }, { status: 504 });
    }
    return NextResponse.json({ success: false, message: 'Proxy error: ' + message }, { status: 500 });
  }
}
