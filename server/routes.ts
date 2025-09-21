import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Validate R2 environment variables
const validateR2Config = () => {
  const required = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing R2 environment variables:', missing.join(', '));
    console.error('   Audio streaming from R2 will not work!');
    console.error('   Please set these variables in your deployment environment.');
    return false;
  }
  
  console.log('✅ R2 configuration validated');
  return true;
};

const hasR2Config = validateR2Config();

// Initialize R2 client only if config is available
let r2Client: S3Client | null = null;
if (hasR2Config) {
  r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
} else {
  console.warn('⚠️  R2 client not initialized due to missing credentials');
}

// Helper function to detect URL type
function getAudioUrlType(url: string): 'google-drive' | 'r2' | 'unknown' {
  // Decode URL first to handle %20 etc
  const decodedUrl = decodeURIComponent(url);
  
  // Google Drive URLs or IDs: exactly 28-33 chars, only letters, numbers, hyphens, underscores
  if (decodedUrl.includes('drive.google.com') || decodedUrl.match(/^[a-zA-Z0-9_-]{28,33}$/)) {
    return 'google-drive';
  }
  // R2 URLs: either direct r2:// protocol or contains R2 domain or has file extension or spaces
  if (decodedUrl.includes('.r2.cloudflarestorage.com') || decodedUrl.startsWith('r2://') || 
      decodedUrl.includes('.mp3') || decodedUrl.includes('/') || decodedUrl.includes(' ')) {
    return 'r2';
  }
  // Default to R2 for anything not clearly Google Drive
  return 'r2';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS preflight handler for audio proxy  
  app.options('/api/audio/:key(*)', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    res.status(200).end();
  });

  // Global CORS middleware for all API routes
  app.use('/api/*', (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Authorization, Origin, X-Requested-With, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    next();
  });

  // HEAD endpoint for audio files (no body streaming)
  app.head('/api/audio/:key(*)', async (req, res) => {
    const fileKey = req.params.key;
    
    if (!fileKey) {
      return res.status(400).json({ error: 'File key is required' });
    }
    
    try {
      const urlType = getAudioUrlType(fileKey);
      console.log('HEAD request for:', fileKey, 'Type:', urlType);
      
      if (urlType === 'r2' || urlType === 'unknown') {
        // HEAD request to R2
        if (!r2Client) {
          console.error('R2 HEAD request failed: R2 client not initialized (missing credentials)');
          return res.status(500).json({ 
            error: 'R2 configuration missing',
            message: 'Audio streaming from R2 is not available due to missing credentials',
            fileKey: fileKey
          });
        }
        
        let bucketName = 'prekensamlingen';
        let objectKey = fileKey;
        
        if (fileKey.startsWith('r2://')) {
          const parts = fileKey.replace('r2://', '').split('/');
          bucketName = parts[0];
          objectKey = parts.slice(1).join('/');
        }
        
        const { HeadObjectCommand } = await import('@aws-sdk/client-s3');
        const command = new HeadObjectCommand({
          Bucket: bucketName,
          Key: objectKey,
        });
        
        const r2Response = await r2Client.send(command);
        
        // Set headers without body
        res.setHeader('Content-Type', r2Response.ContentType || 'audio/mpeg');
        res.setHeader('Content-Length', r2Response.ContentLength?.toString() || '0');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Range');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        res.status(200).end();
      } else {
        // HEAD request to Google Drive using minimal range
        let googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileKey}`;
        
        const response = await fetch(googleDriveUrl, {
          method: 'GET',
          headers: {
            'Range': 'bytes=0-0',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        // Mirror headers without body
        res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
        if (response.headers.get('content-range')) {
          const contentRange = response.headers.get('content-range');
          const totalSize = contentRange?.split('/')[1];
          if (totalSize) res.setHeader('Content-Length', totalSize);
        }
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Range');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        res.status(200).end();
      }
    } catch (error) {
      console.error('HEAD request error:', error);
      res.status(404).end();
    }
  });

  // Hybrid audio proxy endpoint (Google Drive + R2)
  app.get('/api/audio/:key(*)', async (req, res) => {
    const fileKey = req.params.key;
    
    if (!fileKey) {
      return res.status(400).json({ error: 'File key is required' });
    }
    
    try {
      const urlType = getAudioUrlType(fileKey);
      console.log('Proxying audio request for:', fileKey, 'Type:', urlType);
      console.log('Request headers:', req.headers.range ? `Range: ${req.headers.range}` : 'No range header');
      
      if (urlType === 'r2' || urlType === 'unknown') {
        // Handle R2 URLs
        if (!r2Client) {
          console.error('R2 GET request failed: R2 client not initialized (missing credentials)');
          return res.status(500).json({ 
            error: 'R2 configuration missing',
            message: 'Audio streaming from R2 is not available due to missing credentials',
            fileKey: fileKey
          });
        }
        
        let bucketName = 'prekensamlingen';
        let objectKey = fileKey;
        
        // Parse R2 URLs: r2://bucket/key or direct key
        if (fileKey.startsWith('r2://')) {
          const parts = fileKey.replace('r2://', '').split('/');
          bucketName = parts[0];
          objectKey = parts.slice(1).join('/');
        }
        
        console.log('Fetching from R2 bucket:', bucketName, 'key:', objectKey);
        
        const getObjectParams: any = {
          Bucket: bucketName,
          Key: objectKey,
        };
        
        // Handle Range requests for R2
        if (req.headers.range) {
          getObjectParams.Range = req.headers.range;
          console.log('Forwarding Range header to R2:', req.headers.range);
        }
        
        const command = new GetObjectCommand(getObjectParams);
        const r2Response = await r2Client.send(command);
        
        // Set proper response status
        const statusCode = req.headers.range ? 206 : 200;
        res.status(statusCode);
        
        // Set headers from R2 response
        res.setHeader('Content-Type', r2Response.ContentType || 'audio/mpeg');
        if (r2Response.ContentLength) {
          res.setHeader('Content-Length', r2Response.ContentLength.toString());
        }
        if (r2Response.ContentRange) {
          res.setHeader('Content-Range', r2Response.ContentRange);
        }
        res.setHeader('Accept-Ranges', 'bytes');
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Range');
        res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
        
        // Cache headers
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        console.log('R2 Response - Status:', statusCode, 'Content-Length:', r2Response.ContentLength);
        
        // Stream the R2 object body with robust error handling
        if (r2Response.Body) {
          const { pipeline } = await import('stream/promises');
          
          // R2Response.Body is already a Node.js readable stream
          const readable = r2Response.Body as any;
          let streamAborted = false;
          let streamCompleted = false;
          let idleTimeout: NodeJS.Timeout | null = null;
          
          // Set up idle timeout (2 minutes) that resets on data
          const resetIdleTimeout = () => {
            if (idleTimeout) clearTimeout(idleTimeout);
            idleTimeout = setTimeout(() => {
              if (!streamAborted && !streamCompleted) {
                streamAborted = true;
                console.log('R2 stream idle timeout - cleaning up');
                if (readable.destroy) readable.destroy();
                if (!res.destroyed && !res.finished) res.destroy();
              }
            }, 120000); // 2 minutes
          };
          
          // Track client disconnection properly (only if not normally completed)
          const handleClientAbort = () => {
            if (!streamAborted && !streamCompleted && !res.writableEnded && !res.finished) {
              streamAborted = true;
              console.log('Client aborted R2 stream');
              if (readable.destroy) readable.destroy();
            }
          };
          
          // Track normal completion
          const handleStreamComplete = () => {
            streamCompleted = true;
          };
          
          // Cleanup function with precise listener removal
          const cleanup = () => {
            if (idleTimeout) {
              clearTimeout(idleTimeout);
              idleTimeout = null;
            }
            // Remove only our specific listeners
            req.removeListener('aborted', handleClientAbort);
            req.removeListener('close', handleClientAbort);
            res.removeListener('close', handleClientAbort);
            res.removeListener('finish', handleStreamComplete);
            readable.off('data', resetIdleTimeout);
            readable.removeListener('end', handleStreamComplete);
          };
          
          // Listen for client disconnection
          req.once('aborted', handleClientAbort);
          req.once('close', handleClientAbort);
          res.once('close', handleClientAbort);
          res.once('finish', handleStreamComplete);
          readable.once('end', handleStreamComplete);
          
          // Reset timeout on data flow
          readable.on('data', resetIdleTimeout);
          resetIdleTimeout(); // Start the timer
          
          try {
            // Use pipeline for proper backpressure handling
            await pipeline(readable, res);
            console.log('R2 audio stream completed successfully');
            
          } catch (pipelineError: any) {
            console.error('R2 pipeline error:', pipelineError.message || pipelineError);
            
            // Treat expected disconnections as normal
            if (pipelineError.code === 'ERR_STREAM_PREMATURE_CLOSE' || 
                req.aborted || streamAborted) {
              console.log('R2 stream ended due to client disconnect - this is normal');
            } else if (!res.headersSent) {
              res.status(500).json({ error: 'Error streaming audio from R2' });
            }
          } finally {
            cleanup();
          }
        } else {
          res.status(404).json({ error: 'R2 object not found' });
        }
        
        return;
      }
      
      // Handle Google Drive URLs (existing logic)
      let googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileKey}`;
      console.log('Google Drive URL:', googleDriveUrl);
      
      // Prepare headers to forward to Google Drive including Range
      const fetchHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      };
      
      // Forward Range header if present
      if (req.headers.range) {
        fetchHeaders['Range'] = req.headers.range;
        console.log('Forwarding Range header:', req.headers.range);
      }
      
      // Fetch the file from Google Drive with redirect handling
      let response = await fetch(googleDriveUrl, {
        headers: fetchHeaders,
        redirect: 'follow' // Follow redirects automatically
      });
      
      // Handle Google Drive interstitials/confirmation pages
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        const htmlContent = await response.text();
        console.log('Google Drive returned HTML, checking for confirmation page');
        
        // Check if it's a download confirmation page
        const confirmMatch = htmlContent.match(/confirm=([^&"]+)/);
        if (confirmMatch) {
          const confirmToken = confirmMatch[1];
          googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileKey}&confirm=${confirmToken}`;
          console.log('Retrying with confirm token:', confirmToken);
          
          // Retry with confirmation token
          response = await fetch(googleDriveUrl, {
            headers: fetchHeaders
          });
        }
      }
      
      if (!response.ok) {
        console.error('Google Drive fetch failed:', response.status, response.statusText);
        return res.status(response.status).json({ 
          error: 'Failed to fetch audio from Google Drive',
          status: response.status,
          statusText: response.statusText
        });
      }
      
      // Mirror all relevant headers from Google Drive response
      const upstreamContentType = response.headers.get('content-type') || 'audio/mpeg';
      const upstreamContentLength = response.headers.get('content-length');
      const upstreamContentRange = response.headers.get('content-range');
      const upstreamAcceptRanges = response.headers.get('accept-ranges');
      
      // Set response status to match upstream (200 or 206)
      res.status(response.status);
      
      // Mirror headers from upstream
      res.setHeader('Content-Type', upstreamContentType);
      if (upstreamContentLength) {
        res.setHeader('Content-Length', upstreamContentLength);
      }
      if (upstreamContentRange) {
        res.setHeader('Content-Range', upstreamContentRange);
      }
      if (upstreamAcceptRanges) {
        res.setHeader('Accept-Ranges', upstreamAcceptRanges);
      } else {
        res.setHeader('Accept-Ranges', 'bytes');
      }
      
      // Add CORS headers for published domain
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Range');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');
      
      // Add cache headers
      res.setHeader('Cache-Control', 'public, max-age=3600');
      
      console.log('Response status:', response.status);
      console.log('Content-Type:', upstreamContentType);
      console.log('Content-Length:', upstreamContentLength);
      console.log('Content-Range:', upstreamContentRange);
      
      // Stream the audio data using pipeline for proper backpressure
      if (response.body) {
        const { pipeline } = await import('stream/promises');
        const { Readable } = await import('stream');
        
        try {
          // Convert Web ReadableStream to Node.js Readable stream
          const readable = Readable.fromWeb(response.body as any);
          
          // Handle client disconnect
          req.on('close', () => {
            console.log('Client disconnected, aborting stream');
            readable.destroy();
          });
          
          // Pipe the stream
          await pipeline(readable, res);
          console.log('Audio stream completed successfully');
          
        } catch (pipelineError) {
          console.error('Pipeline error:', pipelineError);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Error streaming audio' });
          }
        }
      } else {
        res.status(500).json({ error: 'No response body from Google Drive' });
      }
      
    } catch (error) {
      console.error('Audio proxy error for fileKey:', fileKey);
      console.error('Error details:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error', 
          message: error instanceof Error ? error.message : 'Unknown error',
          fileKey: fileKey
        });
      }
    }
  });

  // Admin authentication middleware - requires ADMIN_SECRET environment variable
  const validateAdminAuth = (req: any, res: any, next: any) => {
    const adminSecret = process.env.ADMIN_SECRET;
    
    if (!adminSecret) {
      console.error('ADMIN_SECRET environment variable not configured');
      return res.status(500).json({ error: 'Admin functionality not configured' });
    }
    
    const providedSecret = req.headers.authorization?.replace('Bearer ', '') || req.headers['x-admin-secret'];
    
    if (providedSecret !== adminSecret) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }
    next();
  };

  // Bulk upload API for admin (protected)
  app.post('/api/admin/bulk-upload', validateAdminAuth, async (req, res) => {
    const { urls, updateSheet = false } = req.body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    if (!r2Client) {
      console.error('Bulk upload failed: R2 client not initialized (missing credentials)');
      return res.status(500).json({ 
        error: 'R2 configuration missing',
        message: 'File upload is not available due to missing R2 credentials'
      });
    }

    if (urls.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 URLs allowed' });
    }

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const sendProgress = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`Processing URL ${i + 1}/${urls.length}: ${url}`);

        try {
          // Extract Google Drive file ID
          const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
          if (!fileIdMatch) {
            sendProgress({ 
              status: 'error', 
              error: 'Invalid Google Drive URL', 
              progress: 100 
            });
            continue;
          }

          const fileId = fileIdMatch[1];
          
          sendProgress({ 
            status: 'downloading', 
            progress: 20 
          });

          // Download from Google Drive
          let googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
          
          const fetchHeaders: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          };

          let response = await fetch(googleDriveUrl, {
            method: 'GET',
            headers: fetchHeaders
          });

          // Handle virus scan confirmation if needed
          if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
            const htmlContent = await response.text();
            const confirmMatch = htmlContent.match(/confirm=([^&"]+)/);
            if (confirmMatch) {
              const confirmToken = confirmMatch[1];
              googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`;
              response = await fetch(googleDriveUrl, {
                method: 'GET',
                headers: fetchHeaders
              });
            }
          }

          if (!response.ok) {
            sendProgress({ 
              status: 'error', 
              error: `Failed to download from Google Drive: ${response.status}`, 
              progress: 100 
            });
            continue;
          }

          // Get filename from response headers or generate one
          let filename = 'sermon.mp3';
          const contentDisposition = response.headers.get('content-disposition');
          if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
              filename = filenameMatch[1].replace(/['"]/g, '');
            }
          } else {
            // Generate filename from drive ID and timestamp
            filename = `drive_${fileId}_${Date.now()}.mp3`;
          }

          // Clean filename: replace spaces with underscores, remove special chars
          const cleanFilename = filename
            .replace(/\s+/g, '_')
            .replace(/[^\w.-]/g, '')
            .replace(/_+/g, '_');

          sendProgress({ 
            status: 'uploading', 
            progress: 60,
            filename: cleanFilename
          });

          // Upload to R2
          const { PutObjectCommand } = await import('@aws-sdk/client-s3');
          const r2Key = `sermons/${cleanFilename}`;
          
          if (!response.body) {
            sendProgress({ 
              status: 'error', 
              error: 'No response body from Google Drive', 
              progress: 100 
            });
            continue;
          }

          // Stream directly from Google Drive to R2 (no memory buffering)
          const { Readable } = await import('stream');
          const readable = Readable.fromWeb(response.body as any);
          
          const putCommand = new PutObjectCommand({
            Bucket: 'prekensamlingen',
            Key: r2Key,
            Body: readable,
            ContentType: response.headers.get('content-type') || 'audio/mpeg',
            ContentLength: response.headers.get('content-length') ? 
              parseInt(response.headers.get('content-length')!) : undefined,
          });

          await r2Client.send(putCommand);

          sendProgress({ 
            status: 'updating-sheet', 
            progress: 90,
            filename: cleanFilename
          });

          // Update Google Sheet if requested
          if (updateSheet) {
            // For now, we'll just log this - Google Sheets API would need authentication
            console.log(`Should update Google Sheet: replace ${fileId} with ${cleanFilename}`);
            // TODO: Implement Google Sheets API update
          }

          sendProgress({ 
            status: 'completed', 
            progress: 100,
            filename: cleanFilename
          });

          console.log(`Successfully uploaded: ${r2Key}`);

        } catch (error) {
          console.error(`Error processing URL ${url}:`, error);
          sendProgress({ 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error',
            progress: 100 
          });
        }
      }

      res.end();
    } catch (error) {
      console.error('Bulk upload error:', error);
      sendProgress({ 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Server error',
        progress: 100 
      });
      res.end();
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  const httpServer = createServer(app);

  return httpServer;
}