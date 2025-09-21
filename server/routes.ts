import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

// Helper function to detect URL type
function getAudioUrlType(url: string): 'google-drive' | 'r2' | 'unknown' {
  if (url.includes('drive.google.com') || url.match(/^[a-zA-Z0-9_-]{28,}$/)) {
    return 'google-drive';
  }
  if (url.includes('.r2.cloudflarestorage.com') || url.startsWith('r2://')) {
    return 'r2';
  }
  return 'unknown';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS preflight handler for audio proxy  
  app.options('/api/audio/:fileId', (req, res) => {
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

  // Hybrid audio proxy endpoint (Google Drive + R2)
  app.get('/api/audio/:fileId', async (req, res) => {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }
    
    try {
      const urlType = getAudioUrlType(fileId);
      console.log('Proxying audio request for:', fileId, 'Type:', urlType);
      console.log('Request headers:', req.headers.range ? `Range: ${req.headers.range}` : 'No range header');
      
      if (urlType === 'r2') {
        // Handle R2 URLs
        let bucketName = 'prekensamlingen';
        let objectKey = fileId;
        
        // Parse R2 URLs: r2://bucket/key or direct key
        if (fileId.startsWith('r2://')) {
          const parts = fileId.replace('r2://', '').split('/');
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
        
        // Stream the R2 object body
        if (r2Response.Body) {
          const { pipeline } = await import('stream/promises');
          const { Readable } = await import('stream');
          
          try {
            const readable = Readable.fromWeb(r2Response.Body as any);
            
            req.on('close', () => {
              console.log('Client disconnected, aborting R2 stream');
              readable.destroy();
            });
            
            await pipeline(readable, res);
            console.log('R2 audio stream completed successfully');
            
          } catch (pipelineError) {
            console.error('R2 pipeline error:', pipelineError);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Error streaming audio from R2' });
            }
          }
        } else {
          res.status(404).json({ error: 'R2 object not found' });
        }
        
        return;
      }
      
      // Handle Google Drive URLs (existing logic)
      let googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
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
          googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`;
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
      console.error('Audio proxy error for fileId:', fileId);
      console.error('Error details:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Internal server error', 
          message: error instanceof Error ? error.message : 'Unknown error',
          fileId: fileId
        });
      }
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