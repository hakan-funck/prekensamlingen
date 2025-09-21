#!/usr/bin/env node

/**
 * Upload tool for migrating audio files from Google Drive to Cloudflare R2
 * Usage: node upload-to-r2.js <google-drive-file-id>
 * 
 * This tool downloads a file from Google Drive and uploads it to R2
 * with proper metadata and naming conventions.
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createWriteStream, createReadStream, unlinkSync, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = 'prekensamlingen';

/**
 * Download file from Google Drive to local temp file
 */
async function downloadFromGoogleDrive(fileId) {
  console.log(`Downloading Google Drive file: ${fileId}`);
  
  let googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  const fetchHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  };
  
  let response = await fetch(googleDriveUrl, {
    headers: fetchHeaders,
    redirect: 'follow'
  });
  
  // Handle Google Drive interstitials/confirmation pages for large files
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    const htmlContent = await response.text();
    console.log('Google Drive returned HTML, checking for confirmation page');
    
    const confirmMatch = htmlContent.match(/confirm=([^&"]+)/);
    if (confirmMatch) {
      const confirmToken = confirmMatch[1];
      googleDriveUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${confirmToken}`;
      console.log('Retrying with confirm token');
      
      response = await fetch(googleDriveUrl, {
        headers: fetchHeaders
      });
    }
  }
  
  if (!response.ok) {
    throw new Error(`Failed to download from Google Drive: ${response.status} ${response.statusText}`);
  }
  
  const contentLength = response.headers.get('content-length');
  console.log(`Download size: ${contentLength ? (parseInt(contentLength) / 1024 / 1024).toFixed(2) + ' MB' : 'unknown'}`);
  
  // Save to temp file
  const tempFile = `temp_${fileId}.mp3`;
  const writeStream = createWriteStream(tempFile);
  
  if (response.body) {
    const { Readable } = await import('stream');
    const readable = Readable.fromWeb(response.body);
    await pipeline(readable, writeStream);
  }
  
  console.log(`Downloaded to temp file: ${tempFile}`);
  return tempFile;
}

/**
 * Upload file to R2 with proper metadata
 */
async function uploadToR2(localFile, targetKey, metadata = {}) {
  console.log(`Uploading to R2: ${targetKey}`);
  
  // Check if object already exists
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: targetKey,
    });
    await r2Client.send(headCommand);
    console.log(`File already exists in R2: ${targetKey}`);
    return targetKey;
  } catch (err) {
    // File doesn't exist, proceed with upload
  }
  
  const fileStream = createReadStream(localFile);
  
  const uploadCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: targetKey,
    Body: fileStream,
    ContentType: 'audio/mpeg',
    Metadata: {
      'original-google-drive-id': metadata.originalId || '',
      'upload-date': new Date().toISOString(),
      'speaker': metadata.speaker || '',
      'title': metadata.title || '',
      'year': metadata.year || '',
      ...metadata
    },
  });
  
  await r2Client.send(uploadCommand);
  console.log(`Successfully uploaded to R2: ${targetKey}`);
  return targetKey;
}

/**
 * Main migration function
 */
async function migrateFile(googleDriveId, targetKey = null, metadata = {}) {
  let tempFile = null;
  
  try {
    // Generate target key if not provided
    if (!targetKey) {
      targetKey = `sermons/${googleDriveId}.mp3`;
    }
    
    console.log(`\n=== Migrating ${googleDriveId} to ${targetKey} ===`);
    
    // Download from Google Drive
    tempFile = await downloadFromGoogleDrive(googleDriveId);
    
    // Upload to R2
    const r2Key = await uploadToR2(tempFile, targetKey, {
      ...metadata,
      originalId: googleDriveId
    });
    
    console.log(`\n✅ Migration complete!`);
    console.log(`Google Drive ID: ${googleDriveId}`);
    console.log(`R2 Key: ${r2Key}`);
    console.log(`R2 URL format for spreadsheet: r2://${BUCKET_NAME}/${r2Key}`);
    
    return r2Key;
    
  } catch (error) {
    console.error(`\n❌ Migration failed:`, error.message);
    throw error;
  } finally {
    // Cleanup temp file
    if (tempFile && existsSync(tempFile)) {
      unlinkSync(tempFile);
      console.log(`Cleaned up temp file: ${tempFile}`);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const googleDriveId = process.argv[2];
  
  if (!googleDriveId) {
    console.log('Usage: node upload-to-r2.js <google-drive-file-id> [target-key] [speaker] [title] [year]');
    console.log('');
    console.log('Examples:');
    console.log('  node upload-to-r2.js 18nXwXIJjRMgwMsNuKddtF3P0l9U6fisP');
    console.log('  node upload-to-r2.js 18nXwXIJjRMgwMsNuKddtF3P0l9U6fisP sermons/andreas-ventin-1975.mp3 "Andreas Ventin" "En preken" "1975"');
    process.exit(1);
  }
  
  const targetKey = process.argv[3];
  const speaker = process.argv[4];
  const title = process.argv[5];
  const year = process.argv[6];
  
  const metadata = {};
  if (speaker) metadata.speaker = speaker;
  if (title) metadata.title = title;
  if (year) metadata.year = year;
  
  migrateFile(googleDriveId, targetKey, metadata)
    .then(() => {
      console.log('\n🎉 Upload completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Upload failed:', error);
      process.exit(1);
    });
}

export { migrateFile };