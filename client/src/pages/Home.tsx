import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { SermonGrid } from '@/components/SermonGrid';
import { AudioPlayer } from '@/components/AudioPlayer';
import type { Sermon } from '@/components/SermonCard';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock data - todo: remove mock functionality
  const allSermons: Sermon[] = [
    {
      id: '1',
      title: 'Guds kjærlighet i våre liv',
      speaker: 'Pastor Ola Nordmann',
      date: '2024-01-15',
      bibleText: '1 Johannes 4:7-21',
      duration: '35:42',
      description: 'En preken om hvordan Guds kjærlighet endrer våre liv og våre relasjoner til andre.',
      audioUrl: '#'
    },
    {
      id: '2',
      title: 'Håpets kraft i vanskelige tider',
      speaker: 'Pastor Kari Hansen',
      date: '2024-01-20',
      bibleText: 'Romerne 15:13',
      duration: '42:15',
      description: 'Refleksjoner over hvordan vi kan finne håp og styrke gjennom Guds ord.',
      audioUrl: '#'
    },
    {
      id: '3',
      title: 'Tro og gjerninger',
      speaker: 'Pastor Per Andersen',
      date: '2024-01-08',
      bibleText: 'Jakob 2:14-26',
      duration: '38:30',
      description: 'En undersøkelse av forholdet mellom tro og gode gjerninger i det kristne liv.',
      audioUrl: '#'
    },
    {
      id: '4',
      title: 'Jesu oppstandelse - vårt håp',
      speaker: 'Pastor Anne Olsen',
      date: '2024-03-31',
      bibleText: '1 Korinterbrev 15:12-22',
      duration: '45:18',
      description: 'En påskepreken om betydningen av Jesu oppstandelse for vårt daglige liv.',
      audioUrl: '#'
    },
    {
      id: '5',
      title: 'Bønn som endrer',
      speaker: 'Pastor Ola Nordmann',
      date: '2023-11-12',
      bibleText: 'Lukas 11:1-13',
      duration: '33:25',
      description: 'Om bønnens kraft og hvordan vi kan utvikle et dypere bønneliv.',
      audioUrl: '#'
    },
    {
      id: '6',
      title: 'Nestekjærlighet i praksis',
      speaker: 'Pastor Kari Hansen',
      date: '2023-09-17',
      bibleText: 'Matteus 22:37-39',
      duration: '39:12',
      description: 'Praktiske veier til å leve ut nestekjærligheten i hverdagen.',
      audioUrl: '#'
    }
  ];

  // Extract unique speakers and years
  const speakers = useMemo(() => {
    return Array.from(new Set(allSermons.map(sermon => sermon.speaker))).sort();
  }, [allSermons]);

  const years = useMemo(() => {
    const yearSet = new Set(allSermons.map(sermon => new Date(sermon.date).getFullYear()));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allSermons]);

  // Filter sermons based on search and filters
  const filteredSermons = useMemo(() => {
    return allSermons.filter(sermon => {
      // Text search
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        sermon.title.toLowerCase().includes(searchLower) ||
        sermon.speaker.toLowerCase().includes(searchLower) ||
        sermon.bibleText.toLowerCase().includes(searchLower) ||
        sermon.description?.toLowerCase().includes(searchLower);

      // Speaker filter
      const matchesSpeaker = selectedSpeakers.length === 0 || 
        selectedSpeakers.includes(sermon.speaker);

      // Year filter
      const sermonYear = new Date(sermon.date).getFullYear();
      const matchesYear = selectedYears.length === 0 || 
        selectedYears.includes(sermonYear);

      return matchesSearch && matchesSpeaker && matchesYear;
    });
  }, [allSermons, searchQuery, selectedSpeakers, selectedYears]);

  const activeFiltersCount = selectedSpeakers.length + selectedYears.length;

  const handlePlayPause = (sermon: Sermon) => {
    if (currentSermon?.id === sermon.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSermon(sermon);
      setIsPlaying(true);
    }
    console.log('Play/pause triggered for:', sermon.title);
  };

  const handlePlayerPlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log('Player play/pause toggled');
  };

  const handlePlayerClose = () => {
    setCurrentSermon(null);
    setIsPlaying(false);
    console.log('Player closed');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        speakers={speakers}
        selectedSpeakers={selectedSpeakers}
        onSpeakersChange={setSelectedSpeakers}
        years={years}
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
        activeFiltersCount={activeFiltersCount}
      />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-serif font-semibold text-foreground mb-2">
            Prekensamlingen
          </h2>
          <p className="text-muted-foreground">
            {filteredSermons.length === allSermons.length 
              ? `${allSermons.length} prekener tilgjengelig`
              : `${filteredSermons.length} av ${allSermons.length} prekener`}
          </p>
        </div>

        <SermonGrid
          sermons={filteredSermons}
          currentSermon={currentSermon}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
        />
      </main>

      <AudioPlayer
        sermon={currentSermon}
        isPlaying={isPlaying}
        onPlayPause={handlePlayerPlayPause}
        onClose={handlePlayerClose}
      />
    </div>
  );
}