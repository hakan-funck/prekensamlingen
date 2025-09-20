import { Calendar, User, BookOpen, Filter } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

interface FilterPanelProps {
  speakers: string[];
  selectedSpeakers: string[];
  onSpeakersChange: (speakers: string[]) => void;
  years: number[];
  selectedYears: number[];
  onYearsChange: (years: number[]) => void;
  activeFiltersCount: number;
}

export function FilterPanel({
  speakers,
  selectedSpeakers,
  onSpeakersChange,
  years,
  selectedYears,
  onYearsChange,
  activeFiltersCount,
}: FilterPanelProps) {
  const handleSpeakerToggle = (speaker: string) => {
    if (selectedSpeakers.includes(speaker)) {
      onSpeakersChange(selectedSpeakers.filter(s => s !== speaker));
    } else {
      onSpeakersChange([...selectedSpeakers, speaker]);
    }
  };

  const handleYearToggle = (year: number) => {
    if (selectedYears.includes(year)) {
      onYearsChange(selectedYears.filter(y => y !== year));
    } else {
      onYearsChange([...selectedYears, year]);
    }
  };

  const clearAllFilters = () => {
    onSpeakersChange([]);
    onYearsChange([]);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative" data-testid="button-filter">
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
            Velg taler og år for å filtrere prekenene
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 mt-6">
          {/* Speakers Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Taler</Label>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {speakers.map((speaker) => (
                <div key={speaker} className="flex items-center space-x-2">
                  <Checkbox
                    id={`speaker-${speaker}`}
                    checked={selectedSpeakers.includes(speaker)}
                    onCheckedChange={() => handleSpeakerToggle(speaker)}
                    data-testid={`checkbox-speaker-${speaker}`}
                  />
                  <Label
                    htmlFor={`speaker-${speaker}`}
                    className="text-sm cursor-pointer"
                  >
                    {speaker}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Years Filter */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">År</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {years.map((year) => (
                <div key={year} className="flex items-center space-x-2">
                  <Checkbox
                    id={`year-${year}`}
                    checked={selectedYears.includes(year)}
                    onCheckedChange={() => handleYearToggle(year)}
                    data-testid={`checkbox-year-${year}`}
                  />
                  <Label
                    htmlFor={`year-${year}`}
                    className="text-sm cursor-pointer"
                  >
                    {year}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
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
      </SheetContent>
    </Sheet>
  );
}