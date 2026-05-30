import { NextRequest, NextResponse } from 'next/server';

const SCRIPT_URL = (process.env.APPS_SCRIPT_URL || '').trim();
const API_SECRET = (process.env.API_SECRET || '').trim();

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
  if (!SCRIPT_URL) {
    return NextResponse.json({ success: false, message: 'APPS_SCRIPT_URL not configured' }, { status: 500 });
  }

  try {
    const params = new URLSearchParams(request.nextUrl.searchParams);
    if (API_SECRET) params.set('secret', API_SECRET);

    const url = `${SCRIPT_URL}?${params.toString()}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    const res = await fetch(url, {
      method:  'GET',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    if (message.includes('abort') || message.includes('timeout')) {
      return NextResponse.json({ success: false, message: 'Server timeout. Coba lagi.' }, { status: 504 });
    }
    return NextResponse.json({ success: false, message: 'Proxy error: ' + message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!SCRIPT_URL) {
    return NextResponse.json({ success: false, message: 'APPS_SCRIPT_URL not configured' }, { status: 500 });
  }

  try {
    const body: Record<string, unknown> = await request.json();
    if (API_SECRET) body.secret = API_SECRET;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(SCRIPT_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    if (message.includes('abort') || message.includes('timeout')) {
      return NextResponse.json({ success: false, message: 'Server timeout. Coba lagi.' }, { status: 504 });
    }
    return NextResponse.json({ success: false, message: 'Proxy error: ' + message }, { status: 500 });
  }
}
