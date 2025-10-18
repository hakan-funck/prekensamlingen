import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { SermonGrid } from '@/components/SermonGrid';
import { AudioPlayer } from '@/components/AudioPlayer';
import type { Sermon } from '@/components/SermonCard';
import { sortBooksInBiblicalOrder } from '@/lib/bible';
import { fetchSermonsFromSheet, type RawSermonData } from '@/lib/googleSheets';
import { parseSermonFromUrl, findSermonFromCriteria } from '@/lib/shareUtils';
import { useToast } from '@/hooks/use-toast';

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | string | null>(null);
  const [selectedBibleBook, setSelectedBibleBook] = useState<string | null>(null);
  const [selectedInterpreter, setSelectedInterpreter] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [allSermons, setAllSermons] = useState<Sermon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shouldOpenFilters, setShouldOpenFilters] = useState(false);
  const { toast } = useToast();

  // Check for openFilters URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('openFilters') === 'true') {
      setShouldOpenFilters(true);
      // Remove the parameter from URL
      params.delete('openFilters');
      const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const handleFiltersOpened = () => {
    setShouldOpenFilters(false);
  };

  // Fetch real sermon data from Google Sheets
  useEffect(() => {
    const loadSermons = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Your spreadsheet ID
        const spreadsheetId = '1mKk16Z1sJ--Dj5GQCVOJE7erRClYAsVUaSiql_RsZfg';
        
        // Fetch first 300 sermons
        const rawSermons = await fetchSermonsFromSheet(spreadsheetId, 300);
        
        // Convert to Sermon format
        const sermons: Sermon[] = rawSermons.map((raw, index) => ({
          id: (index + 1).toString(),
          speaker: raw.speaker,
          date: raw.date,
          bibleBook: raw.bibleBook,
          bibleChapter: raw.bibleChapter,
          bibleVerses: raw.bibleVerses,
          språk: raw.språk as 'fi' | 'sv' | 'no' | 'en' | 'ru',
          tolk: raw.tolk,
          tolkTilSpråk: raw.tolkTilSpråk as 'fi' | 'sv' | 'no' | 'en' | 'ru' | '-',
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

  // Handle shared sermon URLs
  useEffect(() => {
    if (allSermons.length === 0) return;
    
    const sharedData = parseSermonFromUrl();
    if (sharedData?.sermonId) {
      const sermon = findSermonFromCriteria(allSermons, sharedData);
      
      if (sermon) {
        // Clear all filters to ensure sermon is visible
        setSearchQuery('');
        setSelectedSpeaker(null);
        setSelectedYear(null);
        setSelectedBibleBook(null);
        setSelectedInterpreter(null);
        setSelectedLocation(null);
        
        // Set the sermon as current
        setCurrentSermon(sermon);
        
        // Show success message
        toast({
          title: "Preke funnet!",
          description: `Åpnet delt preke av ${sermon.speaker}`,
          duration: 4000,
        });
        
        // Clear the URL parameters after handling
        const url = new URL(window.location.href);
        url.searchParams.delete('sermon');
        url.searchParams.delete('speaker');
        url.searchParams.delete('date');
        url.searchParams.delete('reference');
        window.history.replaceState({}, '', url.toString());
        
        // Scroll to the sermon card after a short delay
        setTimeout(() => {
          const sermonElement = document.querySelector(`[data-testid="card-sermon-${sermon.id}"]`);
          if (sermonElement) {
            sermonElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 200);
      } else {
        // Show error if sermon not found
        toast({
          title: "Preke ikke funnet",
          description: "Kunne ikke finne den delte prekenen. Den kan ha blitt flyttet eller slettet.",
          variant: "destructive",
          duration: 5000,
        });
        
        // Still clear URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete('sermon');
        url.searchParams.delete('speaker');
        url.searchParams.delete('date');
        url.searchParams.delete('reference');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [allSermons, toast]);

  // Extract unique speakers, years, and bible books
  const speakers = useMemo(() => {
    const uniqueSpeakers = Array.from(
      new Set(
        allSermons
          .map(sermon => sermon.speaker)
          .filter(speaker => speaker && speaker.trim() !== '')
      )
    );
    return uniqueSpeakers.sort((a, b) => a.localeCompare(b, 'nb-NO'));
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

  const locations = useMemo(() => {
    const uniqueLocations = Array.from(
      new Set(
        allSermons
          .map(sermon => sermon.sted)
          .filter(sted => sted && sted.trim() !== '' && sted !== '-')
      )
    );
    return uniqueLocations.sort((a, b) => a.localeCompare(b, 'nb-NO'));
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
    const uniqueBooks = Array.from(
      new Set(
        allSermons
          .map(sermon => sermon.bibleBook)
          .filter(bibleBook => bibleBook && bibleBook.trim() !== '')
      )
    );
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

      // Location filter
      const matchesLocation = !selectedLocation || sermon.sted === selectedLocation;

      return matchesSearch && matchesSpeaker && matchesYear && matchesBibleBook && matchesInterpreter && matchesLocation;
    });
  }, [allSermons, searchQuery, selectedSpeaker, selectedYear, selectedBibleBook, selectedInterpreter, selectedLocation]);

  const activeFiltersCount = (selectedSpeaker ? 1 : 0) + (selectedYear ? 1 : 0) + (selectedBibleBook ? 1 : 0) + (selectedInterpreter ? 1 : 0) + (selectedLocation ? 1 : 0);

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
      <div className="min-h-[100svh] bg-background flex items-center justify-center">
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
      <div className="min-h-[100svh] bg-background flex items-center justify-center">
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
    <div className="min-h-[100svh] bg-background">
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
        locations={locations}
        selectedLocation={selectedLocation}
        onLocationChange={setSelectedLocation}
        activeFiltersCount={activeFiltersCount}
        defaultOpenFilters={shouldOpenFilters}
        onFiltersOpened={handleFiltersOpened}
      />
      
      <main className="container mx-auto px-4 py-8 pt-32 xl:pt-24">
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