import { BookOpen } from "lucide-react";
import { SearchBar } from "./SearchBar";
import { FilterPanel } from "./FilterPanel";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  speakers: string[];
  selectedSpeakers: string[];
  onSpeakersChange: (speakers: string[]) => void;
  years: number[];
  selectedYears: number[];
  onYearsChange: (years: number[]) => void;
  bibleBooks: string[];
  selectedBibleBook: string | null;
  onBibleBookChange: (bibleBook: string | null) => void;
  activeFiltersCount: number;
}

export function Header({
  searchQuery,
  onSearchChange,
  speakers,
  selectedSpeakers,
  onSpeakersChange,
  years,
  selectedYears,
  onYearsChange,
  bibleBooks,
  selectedBibleBook,
  onBibleBookChange,
  activeFiltersCount,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
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
              selectedSpeakers={selectedSpeakers}
              onSpeakersChange={onSpeakersChange}
              years={years}
              selectedYears={selectedYears}
              onYearsChange={onYearsChange}
              bibleBooks={bibleBooks}
              selectedBibleBook={selectedBibleBook}
              onBibleBookChange={onBibleBookChange}
              activeFiltersCount={activeFiltersCount}
            />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}