import { useState } from 'react';
import { AudioPlayer } from '../AudioPlayer';
import { Button } from '@/components/ui/button';
import type { Sermon } from '../SermonCard';

export default function AudioPlayerExample() {
  const [sermon, setSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mockSermon: Sermon = {
    id: '1',
    title: 'Håpets kraft i vanskelige tider',
    speaker: 'Pastor Kari Hansen',
    date: '2024-01-20',
    bibleText: 'Romerne 15:13',
    duration: '42:15',
    audioUrl: '#'
  };

  const startPlaying = () => {
    setSermon(mockSermon);
    setIsPlaying(true);
    console.log('Started playing sermon');
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log('Toggled play/pause');
  };

  const closePlayer = () => {
    setSermon(null);
    setIsPlaying(false);
    console.log('Closed player');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <Button onClick={startPlaying}>
          Start avspilling (demo)
        </Button>
      </div>
      <AudioPlayer
        sermon={sermon}
        isPlaying={isPlaying}
        onPlayPause={togglePlayPause}
        onClose={closePlayer}
      />
    </div>
  );
}