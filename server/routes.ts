import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Google Drive audio proxy endpoint
  app.get('/api/audio/:fileId', async (req, res) => {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'File ID is required' });
    }
    
    try {
      // Create the Google Drive download URL
      const googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      console.log('Proxying audio request for file ID:', fileId);
      console.log('Google Drive URL:', googleDriveUrl);
      
      // Fetch the file from Google Drive
      const response = await fetch(googleDriveUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        console.error('Google Drive fetch failed:', response.status, response.statusText);
        return res.status(response.status).json({ 
          error: 'Failed to fetch audio from Google Drive',
          status: response.status,
          statusText: response.statusText
        });
      }
      
      // Get content type from Google Drive response
      const contentType = response.headers.get('content-type') || 'audio/mpeg';
      const contentLength = response.headers.get('content-length');
      
      // Set appropriate headers for audio streaming
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      // Add CORS headers for published domain
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range');
      
      if (contentLength) {
        res.setHeader('Content-Length', contentLength);
      }
      
      // Handle range requests for audio seeking
      const range = req.headers.range;
      if (range && contentLength) {
        try {
          const parts = range.replace(/bytes=/, "").split("-");
          const start = parseInt(parts[0], 10);
          const totalLength = parseInt(contentLength, 10);
          const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
          
          if (isNaN(start) || isNaN(totalLength) || start >= totalLength) {
            console.error('Invalid range request:', { range, contentLength, start, totalLength });
            // Don't handle range, just serve the full file
          } else {
            res.status(206);
            res.setHeader('Content-Range', `bytes ${start}-${end}/${totalLength}`);
            res.setHeader('Content-Length', end - start + 1);
          }
        } catch (rangeError) {
          console.error('Error parsing range request:', rangeError);
          // Continue without range support
        }
      }
      
      // Stream the audio data
      if (response.body) {
        const reader = response.body.getReader();
        
        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                res.end();
                break;
              }
              
              if (!res.write(value)) {
                // If the client's buffer is full, wait for drain event
                await new Promise(resolve => res.once('drain', resolve));
              }
            }
          } catch (error) {
            console.error('Error streaming audio:', error);
            if (!res.headersSent) {
              res.status(500).json({ error: 'Error streaming audio' });
            }
            res.end();
          } finally {
            reader.releaseLock();
          }
        };
        
        await pump();
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