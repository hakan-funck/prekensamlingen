import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { SermonGrid } from '@/components/SermonGrid';
import { AudioPlayer } from '@/components/AudioPlayer';
import type { Sermon } from '@/components/SermonCard';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedBibleBooks, setSelectedBibleBooks] = useState<string[]>([]);
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Mock data based on Google Sheets - will be replaced with API calls
  const allSermons: Sermon[] = [
    {
      id: '1',
      speaker: 'Heino Kouva',
      date: '1967-05-14',
      bibleBook: 'Matt',
      bibleChapter: '5',
      bibleVerses: '27-30',
      språk: 'finsk',
      tolk: 'Hans Sundberg',
      tolkTilSpråk: 'svensk',
      duration: '29:10',
      sted: 'Bosund',
      kilde: 'Kassett HF 616',
      annenInfo: 'Pinseforsamling',
      audioUrl: '#'
    },
    {
      id: '2',
      speaker: 'Andreas Ventin',
      date: '',
      bibleBook: 'Luk',
      bibleChapter: '10',
      bibleVerses: '30-35',
      språk: 'svensk',
      tolk: 'Östen Tano',
      tolkTilSpråk: 'finsk',
      duration: '42:45',
      sted: 'Svanstein',
      kilde: 'Kassett',
      audioUrl: '#'
    },
    {
      id: '3',
      speaker: 'Kåre Suhr',
      date: '',
      bibleBook: 'Jer',
      bibleChapter: '31',
      bibleVerses: '31-34',
      språk: 'norsk',
      tolk: '-',
      tolkTilSpråk: '-',
      duration: '17:04',
      sted: 'Elvebakken',
      kilde: 'Opptak i benken',
      annenInfo: 'Litt dårlig lydkvalitet',
      audioUrl: '#'
    },
    {
      id: '4',
      speaker: 'Viktor Ylipää',
      date: '24.03.1990',
      bibleBook: 'Ef',
      bibleChapter: '2',
      bibleVerses: '11-22',
      språk: 'finsk',
      tolk: 'Harry Ylipää',
      tolkTilSpråk: 'svensk',
      duration: '59:58',
      sted: 'Pajala',
      kilde: 'Kassett HF 630',
      annenInfo: 'Salme på slutten',
      audioUrl: '#'
    },
    {
      id: '5',
      speaker: 'Alvin Holmgren',
      date: '30.11.1997',
      bibleBook: 'Joh',
      bibleChapter: '1',
      bibleVerses: '1-14',
      språk: 'engelsk',
      tolk: '-',
      tolkTilSpråk: '-',
      duration: '44:46',
      sted: 'Clatskanie, Oregon',
      kilde: 'Kassett',
      annenInfo: 'Innledningsbønn av Arne Nordahl og salme før preken. Preken begynner på ca 8:00',
      audioUrl: '#'
    },
    {
      id: '6',
      speaker: 'Henry Baardsen',
      date: '16.05.2021',
      bibleBook: 'Joh',
      bibleChapter: '3',
      bibleVerses: '16-21',
      språk: 'norsk',
      tolk: '-',
      tolkTilSpråk: '-',
      duration: '38:41',
      sted: 'Elvebakken',
      kilde: 'Youtube',
      audioUrl: '#'
    }
  ];

  // Extract unique speakers, years, and bible books
  const speakers = useMemo(() => {
    return Array.from(new Set(allSermons.map(sermon => sermon.speaker))).sort();
  }, [allSermons]);

  const years = useMemo(() => {
    const yearSet = new Set(allSermons.map(sermon => new Date(sermon.date).getFullYear()));
    return Array.from(yearSet).sort((a, b) => b - a);
  }, [allSermons]);

  const bibleBooks = useMemo(() => {
    return Array.from(new Set(allSermons.map(sermon => sermon.bibleBook))).sort();
  }, [allSermons]);

  // Filter sermons based on search and filters
  const filteredSermons = useMemo(() => {
    return allSermons.filter(sermon => {
      // Text search
      const searchLower = searchQuery.toLowerCase();
      const bibleText = `${sermon.bibleBook} ${sermon.bibleChapter}:${sermon.bibleVerses}`;
      const matchesSearch = !searchQuery || 
        sermon.speaker.toLowerCase().includes(searchLower) ||
        bibleText.toLowerCase().includes(searchLower) ||
        sermon.bibleBook.toLowerCase().includes(searchLower) ||
        sermon.annenInfo?.toLowerCase().includes(searchLower);

      // Speaker filter
      const matchesSpeaker = selectedSpeakers.length === 0 || 
        selectedSpeakers.includes(sermon.speaker);

      // Year filter
      const sermonYear = new Date(sermon.date).getFullYear();
      const matchesYear = selectedYears.length === 0 || 
        selectedYears.includes(sermonYear);

      // Bible book filter
      const matchesBibleBook = selectedBibleBooks.length === 0 || 
        selectedBibleBooks.includes(sermon.bibleBook);

      return matchesSearch && matchesSpeaker && matchesYear && matchesBibleBook;
    });
  }, [allSermons, searchQuery, selectedSpeakers, selectedYears, selectedBibleBooks]);

  const activeFiltersCount = selectedSpeakers.length + selectedYears.length + selectedBibleBooks.length;

  const handlePlayPause = (sermon: Sermon) => {
    if (currentSermon?.id === sermon.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSermon(sermon);
      setIsPlaying(true);
    }
    console.log('Play/pause triggered for:', sermon.speaker);
  };

  const handlePlayerPlayPause = () => {
    setIsPlaying(!isPlaying);
    console.log('Player play/pause toggled');
  };

  const handlePlayerClose = () => {
    setCurrentSermon(null);
    setIsPlaying(false);
    console.log('Player closed');
    setIsPlaying(false);
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
        bibleBooks={bibleBooks}
        selectedBibleBooks={selectedBibleBooks}
        onBibleBooksChange={setSelectedBibleBooks}
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