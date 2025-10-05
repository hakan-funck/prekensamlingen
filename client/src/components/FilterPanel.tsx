import { useState, useEffect, useRef } from "react";
import { Calendar, User, BookOpen, Filter, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterPanelProps {
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
  defaultOpen?: boolean;
  onOpened?: () => void;
}

export function FilterPanel({
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
  defaultOpen = false,
  onOpened,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);
  const hasOpenedRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (defaultOpen && !hasOpenedRef.current) {
      // Only open if this FilterPanel's trigger is actually visible
      const isVisible = triggerRef.current?.offsetParent !== null;
      
      if (isVisible) {
        setOpen(true);
        hasOpenedRef.current = true;
        // Notify parent that panel has opened
        if (onOpened) {
          onOpened();
        }
      }
    }
  }, [defaultOpen, onOpened]);
  const handleSpeakerChange = (value: string) => {
    if (value === 'all') {
      onSpeakerChange(null);
    } else {
      onSpeakerChange(value);
    }
  };

  const handleYearChange = (value: string) => {
    if (value === 'all') {
      onYearChange(null);
    } else if (value === 'unknown') {
      onYearChange('Ukjent');
    } else {
      onYearChange(parseInt(value, 10));
    }
  };

  const handleInterpreterChange = (value: string) => {
    if (value === 'all') {
      onInterpreterChange(null);
    } else {
      onInterpreterChange(value);
    }
  };

  const handleBibleBookChange = (value: string) => {
    if (value === 'all') {
      onBibleBookChange(null);
    } else {
      onBibleBookChange(value);
    }
  };

  const clearAllFilters = () => {
    onSpeakerChange(null);
    onYearChange(null);
    onBibleBookChange(null);
    onInterpreterChange(null);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button ref={triggerRef} variant="outline" className="relative" data-testid="button-filter">
          <Filter className="h-4 w-4 mr-2" />
          Filtrer
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filtrer prekener</SheetTitle>
          <SheetDescription>
            Velg taler, bibelbok, år og tolk for å filtrere prekenene
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Speakers Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Taler</Label>
            </div>
            <Select 
              value={selectedSpeaker || 'all'} 
              onValueChange={handleSpeakerChange}
            >
              <SelectTrigger data-testid="select-speaker">
                <SelectValue placeholder="Velg taler" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle talere</SelectItem>
                {speakers.map((speaker) => (
                  <SelectItem 
                    key={speaker} 
                    value={speaker}
                    data-testid={`option-speaker-${speaker}`}
                  >
                    {speaker}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bible Books Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Bibelbok</Label>
            </div>
            <Select 
              value={selectedBibleBook || 'all'} 
              onValueChange={handleBibleBookChange}
            >
              <SelectTrigger data-testid="select-bible-book">
                <SelectValue placeholder="Velg bibelbok" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle bøker</SelectItem>
                {bibleBooks.map((bibleBook) => (
                  <SelectItem 
                    key={bibleBook} 
                    value={bibleBook}
                    data-testid={`option-bible-book-${bibleBook}`}
                  >
                    {bibleBook}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Years Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">År</Label>
            </div>
            <Select 
              value={selectedYear === null ? 'all' : selectedYear === 'Ukjent' ? 'unknown' : selectedYear.toString()} 
              onValueChange={handleYearChange}
            >
              <SelectTrigger data-testid="select-year">
                <SelectValue placeholder="Velg år" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle år</SelectItem>
                <SelectItem value="unknown">Ukjent</SelectItem>
                {years.map((year) => (
                  <SelectItem 
                    key={year} 
                    value={year.toString()}
                    data-testid={`option-year-${year}`}
                  >
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interpreter Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Tolk</Label>
            </div>
            <Select 
              value={selectedInterpreter || 'all'} 
              onValueChange={handleInterpreterChange}
            >
              <SelectTrigger data-testid="select-interpreter">
                <SelectValue placeholder="Velg tolk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle tolker</SelectItem>
                {interpreters.map((interpreter) => (
                  <SelectItem 
                    key={interpreter} 
                    value={interpreter}
                    data-testid={`option-interpreter-${interpreter}`}
                  >
                    {interpreter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="default"
              onClick={() => setOpen(false)}
              className="w-full"
              data-testid="button-show-results"
            >
              Vis
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                onClick={clearAllFilters}
                className="w-full"
                data-testid="button-clear-filters"
              >
                Fjern alle filtre
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}