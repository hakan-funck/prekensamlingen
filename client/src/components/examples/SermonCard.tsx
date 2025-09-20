import { useState } from 'react';
import { SermonCard, type Sermon } from '../SermonCard';

export default function SermonCardExample() {
  const [isPlaying, setIsPlaying] = useState(false);

  const sermon: Sermon = {
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
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log('Play/pause triggered for sermon:', sermon.title);
  };

  return (
    <div className="p-4 max-w-sm">
      <SermonCard 
        sermon={sermon}
        isPlaying={isPlaying}
        onPlayPause={handlePlayPause}
        isExpanded={false}
        onToggleExpand={() => console.log('Toggle expand clicked')}
      />
    </div>
  );
}