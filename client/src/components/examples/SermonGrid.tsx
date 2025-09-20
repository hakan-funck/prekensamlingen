import { useState } from 'react';
import { SermonGrid } from '../SermonGrid';
import type { Sermon } from '../SermonCard';

export default function SermonGridExample() {
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock data - todo: remove mock functionality
  const sermons: Sermon[] = [
    {
      id: '1',
      title: 'Guds kjærlighet i våre liv',
      speaker: 'Pastor Ola Nordmann',
      date: '2024-01-15',
      bibleText: '1 Johannes 4:7-21',
      duration: '35:42',
      description: 'En preken om hvordan Guds kjærlighet endrer våre liv og våre relasjoner til andre.',
      audioUrl: '#',
      sted: 'Betlehem Kirke',
      språk: 'no',
      tolk: 'sv',
      interpreterName: 'Anna Svensson',
      kilde: 'Kirkearkiv 2024',
      annenInfo: 'Opptak fra søndagsgudstjeneste'
    },
    {
      id: '2',
      title: 'Håpets kraft i vanskelige tider',
      speaker: 'Pastor Kari Hansen',
      date: '2024-01-20',
      bibleText: 'Romerne 15:13',
      duration: '42:15',
      description: 'Refleksjoner over hvordan vi kan finne håp og styrke gjennom Guds ord.',
      audioUrl: '#',
      sted: 'Salem Menighet',
      språk: 'no',
      tolk: '-',
      kilde: 'Menighetens lydarkiv',
      annenInfo: 'Spesielt fokus på Romerbrevet'
    },
    {
      id: '3',
      title: 'Tro og gjerninger',
      speaker: 'Pastor Per Andersen',
      date: '2024-01-08',
      bibleText: 'Jakob 2:14-26',
      duration: '38:30',
      audioUrl: '#',
      sted: 'Filadelfia Oslo',
      språk: 'no',
      tolk: 'fi',
      interpreterName: 'Matti Virtanen',
      kilde: 'Filadelfia Opptak',
      annenInfo: 'Del av prekenserie om Jakob'
    }
  ];

  const handlePlayPause = (sermon: Sermon) => {
    if (currentSermon?.id === sermon.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSermon(sermon);
      setIsPlaying(true);
    }
    console.log('Play/pause triggered for:', sermon.title);
  };

  return (
    <div className="p-6">
      <SermonGrid
        sermons={sermons}
        currentSermon={currentSermon}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
      />
    </div>
  );
}