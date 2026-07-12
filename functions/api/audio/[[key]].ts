interface Env {
  AUDIO_BUCKET: R2Bucket;
}

function isGoogleDriveId(key: string): boolean {
  return /^[a-zA-Z0-9_-]{28,33}$/.test(key);
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const keyParts = params.key as string[] | undefined;
  const fileKey = keyParts ? keyParts.join('/') : '';

  if (!fileKey) {
    return new Response(JSON.stringify({ error: 'File key is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const rangeHeader = request.headers.get('range') || undefined;

  // --- Case 1: Google Drive file (old links not yet migrated to R2) ---
  if (isGoogleDriveId(fileKey)) {
    let driveUrl = `https://drive.google.com/uc?export=download&id=${fileKey}`;
    const driveHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };
    if (rangeHeader) driveHeaders['Range'] = rangeHeader;

    let driveResponse = await fetch(driveUrl, { headers: driveHeaders, redirect: 'follow' });

    // Google Drive shows an interstitial "confirm" page for larger files
    const contentType = driveResponse.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const html = await driveResponse.text();
      const confirmMatch = html.match(/confirm=([^&"]+)/);
      if (confirmMatch) {
        driveUrl = `${driveUrl}&confirm=${confirmMatch[1]}`;
        driveResponse = await fetch(driveUrl, { headers: driveHeaders });
      }
    }

    if (!driveResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch from Google Drive' }), {
        status: driveResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const headers = new Headers(corsHeaders);
    headers.set('Content-Type', driveResponse.headers.get('content-type') || 'audio/mpeg');
    const len = driveResponse.headers.get('content-length');
    if (len) headers.set('Content-Length', len);
    const cr = driveResponse.headers.get('content-range');
    if (cr) headers.set('Content-Range', cr);
    headers.set('Accept-Ranges', 'bytes');
    headers.set('Cache-Control', 'public, max-age=3600');

    return new Response(driveResponse.body, { status: driveResponse.status, headers });
  }

  // --- Case 2: R2-lagret fil (den nye, foretrukne løsningen) ---
  const objectKey = fileKey.startsWith('sermons/') ? fileKey : `sermons/${fileKey}`;

  const r2Options: R2GetOptions = {};
  if (rangeHeader) {
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const start = parseInt(match[1], 10);
      const end = match[2] ? parseInt(match[2], 10) : undefined;
      r2Options.range = end !== undefined ? { offset: start, length: end - start + 1 } : { offset: start };
    }
  }

  const object = request.method === 'HEAD'
    ? await env.AUDIO_BUCKET.head(objectKey)
    : await env.AUDIO_BUCKET.get(objectKey, r2Options);

  if (!object) {
    return new Response(JSON.stringify({ error: 'Audio file not found', fileKey: objectKey }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const headers = new Headers(corsHeaders);
  object.writeHttpMetadata(headers);
  headers.set('Content-Type', object.httpMetadata?.contentType || 'audio/mpeg');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=3600');
  headers.set('etag', object.httpEtag);

  const isPartial = 'range' in object && (object as R2ObjectBody).range !== undefined;
  if (isPartial) {
    const r2 = object as R2Object & { range?: { offset: number; length: number } };
    const total = r2.size;
    if (r2.range) {
      const start = r2.range.offset;
      const end = start + r2.range.length - 1;
      headers.set('Content-Range', `bytes ${start}-${end}/${total}`);
      headers.set('Content-Length', String(r2.range.length));
    }
  } else {
    headers.set('Content-Length', String(object.size));
  }

  if (request.method === 'HEAD') {
    return new Response(null, { status: 200, headers });
  }

  return new Response((object as R2ObjectBody).body, {
    status: isPartial ? 206 : 200,
    headers,
  });
};