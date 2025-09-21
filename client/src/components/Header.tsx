import { BookOpen, Info } from "lucide-react";
import { Link } from "wouter";
import { SearchBar } from "./SearchBar";
import { FilterPanel } from "./FilterPanel";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  speakers: string[];
  selectedSpeaker: string | null;
  onSpeakerChange: (speaker: string | null) => void;
  years: number[];
  selectedYear: number | string | null;
  onYearChange: (year: number | string | null) => void;
  bibleBooks: string[];
  selectedBibleBook: string | null;
  onBibleBookChange: (bibleBook: string | null) => void;
  interpreters: string[];
  selectedInterpreter: string | null;
  onInterpreterChange: (interpreter: string | null) => void;
  activeFiltersCount: number;
}

export function Header({
  searchQuery,
  onSearchChange,
  speakers,
  selectedSpeaker,
  onSpeakerChange,
  years,
  selectedYear,
  onYearChange,
  bibleBooks,
  selectedBibleBook,
  onBibleBookChange,
  interpreters,
  selectedInterpreter,
  onInterpreterChange,
  activeFiltersCount,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b supports-[backdrop-filter]:bg-background/60 pt-[env(safe-area-inset-top)]">
      <div className="container mx-auto px-4 py-4">
        {/* Desktop Layout: All in one row */}
        <div className="hidden xl:flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-serif font-semibold text-foreground">
              Prekensamlingen
            </h1>
          </div>

          {/* Search */}
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Søk prekener, taler, bibeltekster..."
          />

          {/* Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <FilterPanel
              speakers={speakers}
              selectedSpeaker={selectedSpeaker}
              onSpeakerChange={onSpeakerChange}
              years={years}
              selectedYear={selectedYear}
              onYearChange={onYearChange}
              bibleBooks={bibleBooks}
              selectedBibleBook={selectedBibleBook}
              onBibleBookChange={onBibleBookChange}
              interpreters={interpreters}
              selectedInterpreter={selectedInterpreter}
              onInterpreterChange={onInterpreterChange}
              activeFiltersCount={activeFiltersCount}
            />
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-about" asChild>
              <Link href="/about">
                <Info className="h-4 w-4" />
                Om
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Layout: Two rows */}
        <div className="xl:hidden space-y-3">
          {/* Row 1: Logo + Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <h1 className="text-lg sm:text-xl font-serif font-semibold text-foreground">
                Prekensamlingen
              </h1>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <FilterPanel
                speakers={speakers}
                selectedSpeaker={selectedSpeaker}
                onSpeakerChange={onSpeakerChange}
                years={years}
                selectedYear={selectedYear}
                onYearChange={onYearChange}
                bibleBooks={bibleBooks}
                selectedBibleBook={selectedBibleBook}
                onBibleBookChange={onBibleBookChange}
                interpreters={interpreters}
                selectedInterpreter={selectedInterpreter}
                onInterpreterChange={onInterpreterChange}
                activeFiltersCount={activeFiltersCount}
              />
              <Button variant="ghost" size="sm" className="gap-1 sm:gap-2" data-testid="button-about" asChild>
                <Link href="/about">
                  <Info className="h-4 w-4" />
                  <span className="hidden sm:inline">Om</span>
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>

          {/* Row 2: Search (full width) */}
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Søk prekener, taler, bibeltekster..."
          />
        </div>
      </div>
    </header>
  );
}