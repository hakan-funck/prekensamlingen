import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Upload, FileAudio, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadStatus {
  url: string;
  filename?: string;
  status: 'pending' | 'downloading' | 'uploading' | 'updating-sheet' | 'completed' | 'error';
  error?: string;
  progress?: number;
}

export default function AdminUpload() {
  const [urls, setUrls] = useState('');
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const parseUrls = (urlText: string): string[] => {
    return urlText
      .split('\n')
      .map(url => url.trim())
      .filter(url => url && (url.includes('drive.google.com') || url.length > 20));
  };

  const startBulkUpload = async () => {
    const urlList = parseUrls(urls);
    
    if (urlList.length === 0) {
      toast({
        title: 'Ingen URLs funnet',
        description: 'Lim inn Google Drive URLs, en per linje.',
        variant: 'destructive'
      });
      return;
    }

    if (urlList.length > 10) {
      toast({
        title: 'For mange URLs',
        description: 'Maksimalt 10 filer om gangen.',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);
    setUploads(urlList.map(url => ({ url, status: 'pending' })));

    try {
      for (let i = 0; i < urlList.length; i++) {
        const url = urlList[i];
        
        // Update status to downloading
        setUploads(prev => prev.map((upload, idx) => 
          idx === i ? { ...upload, status: 'downloading', progress: 0 } : upload
        ));

        // Get admin secret from user input or localStorage
        const adminSecret = localStorage.getItem('admin-secret') || prompt('Admin Secret:');
        if (!adminSecret) {
          toast({
            title: 'Admin Secret påkrevd',
            description: 'Du må oppgi admin secret for å bruke denne funksjonen.',
            variant: 'destructive'
          });
          setIsUploading(false);
          return;
        }
        
        if (adminSecret !== localStorage.getItem('admin-secret')) {
          localStorage.setItem('admin-secret', adminSecret);
        }

        const response = await fetch('/api/admin/bulk-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Secret': adminSecret
          },
          body: JSON.stringify({ 
            urls: [url],
            updateSheet: true 
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setUploads(prev => prev.map((upload, idx) => 
            idx === i ? { ...upload, status: 'error', error: errorData.error } : upload
          ));
          continue;
        }

        // Process streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          setUploads(prev => prev.map((upload, idx) => 
            idx === i ? { ...upload, status: 'error', error: 'Ingen respons fra server' } : upload
          ));
          continue;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                setUploads(prev => prev.map((upload, idx) => 
                  idx === i ? {
                    ...upload,
                    status: data.status,
                    progress: data.progress,
                    filename: data.filename,
                    error: data.error
                  } : upload
                ));
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
      }

      toast({
        title: 'Upload ferdig!',
        description: `${urlList.length} filer prosessert.`,
      });

    } catch (error) {
      toast({
        title: 'Upload feil',
        description: error instanceof Error ? error.message : 'Ukjent feil',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'pending':
        return <FileAudio className="h-4 w-4 text-muted-foreground" />;
      case 'downloading':
      case 'uploading':
      case 'updating-sheet':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (upload: UploadStatus) => {
    switch (upload.status) {
      case 'pending':
        return 'Venter...';
      case 'downloading':
        return 'Laster ned fra Google Drive...';
      case 'uploading':
        return 'Laster opp til R2...';
      case 'updating-sheet':
        return 'Oppdaterer Google Sheet...';
      case 'completed':
        return `Ferdig: ${upload.filename}`;
      case 'error':
        return `Feil: ${upload.error}`;
      default:
        return '';
    }
  };

  const completedUploads = uploads.filter(u => u.status === 'completed');
  const failedUploads = uploads.filter(u => u.status === 'error');

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Admin Upload til R2
          </CardTitle>
          <CardDescription>
            Last opp flere lydfiler fra Google Drive til R2 og oppdater Google Sheet automatisk.
            Maks 10 filer om gangen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="urls" className="text-sm font-medium mb-2 block">
              Google Drive URLs (en per linje):
            </label>
            <Textarea
              id="urls"
              data-testid="textarea-urls"
              placeholder="https://drive.google.com/file/d/1ABC123.../view&#10;https://drive.google.com/file/d/1XYZ789.../view&#10;..."
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              rows={6}
              disabled={isUploading}
            />
          </div>

          <Button 
            onClick={startBulkUpload}
            disabled={isUploading || !urls.trim()}
            className="w-full"
            data-testid="button-start-upload"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Prosesserer...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Start Bulk Upload
              </>
            )}
          </Button>

          {uploads.length > 0 && (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold">Upload Status</h3>
              
              {uploads.map((upload, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(upload.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" data-testid={`text-url-${index}`}>
                        URL {index + 1}: {upload.url.split('/').pop() || upload.url}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-status-${index}`}>
                        {getStatusText(upload)}
                      </p>
                      {upload.progress !== undefined && upload.status !== 'completed' && upload.status !== 'error' && (
                        <Progress value={upload.progress} className="mt-2" data-testid={`progress-${index}`} />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {completedUploads.length > 0 && (
                <Alert data-testid="alert-success">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Upload ferdig!</strong> {completedUploads.length} filer lastet opp:
                    <ul className="mt-2 ml-4 list-disc">
                      {completedUploads.map((upload, index) => (
                        <li key={index} className="text-sm" data-testid={`completed-filename-${index}`}>
                          {upload.filename}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {failedUploads.length > 0 && (
                <Alert variant="destructive" data-testid="alert-error">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Noen uploads feilet:</strong>
                    <ul className="mt-2 ml-4 list-disc">
                      {failedUploads.map((upload, index) => (
                        <li key={index} className="text-sm" data-testid={`error-message-${index}`}>
                          {upload.error}
                        </li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}