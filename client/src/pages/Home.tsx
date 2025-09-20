import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { SermonGrid } from '@/components/SermonGrid';
import { AudioPlayer } from '@/components/AudioPlayer';
import type { Sermon } from '@/components/SermonCard';
import { sortBooksInBiblicalOrder } from '@/lib/bible';
import { fetchSermonsFromSheet, type RawSermonData } from '@/lib/googleSheets';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | string | null>(null);
  const [selectedBibleBook, setSelectedBibleBook] = useState<string | null>(null);
  const [selectedInterpreter, setSelectedInterpreter] = useState<string | null>(null);
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [allSermons, setAllSermons] = useState<Sermon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real sermon data from Google Sheets
  useEffect(() => {
    const loadSermons = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Your spreadsheet ID
        const spreadsheetId = '1mKk16Z1sJ--Dj5GQCVOJE7erRClYAsVUaSiql_RsZfg';
        
        // Fetch first 46 sermons (rows 5-50) as requested
        const rawSermons = await fetchSermonsFromSheet(spreadsheetId, 46);
        
        // Convert to Sermon format
        const sermons: Sermon[] = rawSermons.map((raw, index) => ({
          id: (index + 1).toString(),
          speaker: raw.speaker,
          date: raw.date,
          bibleBook: raw.bibleBook,
          bibleChapter: raw.bibleChapter,
          bibleVerses: raw.bibleVerses,
          språk: raw.språk as 'fi' | 'sv' | 'no' | 'en',
          tolk: raw.tolk,
          tolkTilSpråk: raw.tolkTilSpråk as 'fi' | 'sv' | 'no' | 'en' | '-',
          duration: raw.duration,
          sted: raw.sted,
          kilde: raw.kilde,
          annenInfo: raw.annenInfo,
          audioUrl: raw.audioUrl
        }));
        
        setAllSermons(sermons);
      } catch (err) {
        console.error('Error loading sermons:', err);
        setError('Kunne ikke laste prekener fra Google Sheets');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSermons();
  }, []);

  // Extract unique speakers, years, and bible books
  const speakers = useMemo(() => {
    return Array.from(new Set(allSermons.map(sermon => sermon.speaker))).sort((a, b) => a.localeCompare(b, 'nb-NO'));
  }, [allSermons]);

  const interpreters = useMemo(() => {
    const uniqueInterpreters = Array.from(
      new Set(
        allSermons
          .map(sermon => sermon.tolk)
          .filter(tolk => tolk && tolk.trim() !== '' && tolk !== '-')
      )
    );
    return uniqueInterpreters.sort((a, b) => a.localeCompare(b, 'nb-NO'));
  }, [allSermons]);

  const years = useMemo(() => {
    const getSermonYear = (dateString: string): number | null => {
      if (!dateString || dateString.trim() === '') {
        return null;
      }
      
      const trimmed = dateString.trim();
      
      // If it's just a year (4 digits), return it directly
      if (/^\d{4}$/.test(trimmed)) {
        return parseInt(trimmed, 10);
      }
      
      // If it's dd.mm.yyyy format, extract year
      const ddmmyyyy = trimmed.match(/^\d{1,2}\.\d{1,2}\.(\d{4})$/);
      if (ddmmyyyy) {
        return parseInt(ddmmyyyy[1], 10);
      }
      
      // Try to parse as date and extract year
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return date.getFullYear();
      }
      
      return null;
    };
    
    const yearSet = new Set(
      allSermons
        .map(sermon => getSermonYear(sermon.date))
        .filter((year): year is number => year !== null)
    );
    
    // Always include "Ukjent" option and sort chronologically (oldest first)
    const yearsWithUnknown = Array.from(yearSet).sort((a, b) => a - b);
    return yearsWithUnknown;
  }, [allSermons]);

  const bibleBooks = useMemo(() => {
    const uniqueBooks = Array.from(new Set(allSermons.map(sermon => sermon.bibleBook)));
    return sortBooksInBiblicalOrder(uniqueBooks);
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
      const matchesSpeaker = !selectedSpeaker || sermon.speaker === selectedSpeaker;

      // Year filter
      const getSermonYear = (dateString: string): number | null => {
        if (!dateString || dateString.trim() === '') {
          return null;
        }
        
        const trimmed = dateString.trim();
        
        // If it's just a year (4 digits), return it directly
        if (/^\d{4}$/.test(trimmed)) {
          return parseInt(trimmed, 10);
        }
        
        // If it's dd.mm.yyyy format, extract year
        const ddmmyyyy = trimmed.match(/^\d{1,2}\.\d{1,2}\.(\d{4})$/);
        if (ddmmyyyy) {
          return parseInt(ddmmyyyy[1], 10);
        }
        
        // Try to parse as date and extract year
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          return date.getFullYear();
        }
        
        return null;
      };
      
      const sermonYear = getSermonYear(sermon.date);
      const matchesYear = !selectedYear || 
        (selectedYear === "Ukjent" ? sermonYear === null : sermonYear === selectedYear);

      // Bible book filter
      const matchesBibleBook = !selectedBibleBook || 
        sermon.bibleBook === selectedBibleBook;

      // Interpreter filter
      const matchesInterpreter = !selectedInterpreter || sermon.tolk === selectedInterpreter;

      return matchesSearch && matchesSpeaker && matchesYear && matchesBibleBook && matchesInterpreter;
    });
  }, [allSermons, searchQuery, selectedSpeaker, selectedYear, selectedBibleBook, selectedInterpreter]);

  const activeFiltersCount = (selectedSpeaker ? 1 : 0) + (selectedYear ? 1 : 0) + (selectedBibleBook ? 1 : 0) + (selectedInterpreter ? 1 : 0);

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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laster prekener fra Google Sheets...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-destructive mb-2">Feil ved lasting av data</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Prøv igjen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        speakers={speakers}
        selectedSpeaker={selectedSpeaker}
        onSpeakerChange={setSelectedSpeaker}
        years={years}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        bibleBooks={bibleBooks}
        selectedBibleBook={selectedBibleBook}
        onBibleBookChange={setSelectedBibleBook}
        interpreters={interpreters}
        selectedInterpreter={selectedInterpreter}
        onInterpreterChange={setSelectedInterpreter}
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