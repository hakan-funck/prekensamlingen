import { useState } from 'react';
import { ThemeProvider } from '../ThemeProvider';
import { Header } from '../Header';

export default function HeaderExample() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);

  const speakers = ['Ola Nordmann', 'Kari Hansen', 'Per Andersen', 'Anne Olsen'];
  const years = [2024, 2023, 2022, 2021, 2020];
  const activeFiltersCount = selectedSpeakers.length + selectedYears.length;

  return (
    <ThemeProvider>
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
        <div className="p-4">
          <p className="text-muted-foreground">Søketerm: "{searchQuery}"</p>
          <p className="text-muted-foreground">Valgte talere: {selectedSpeakers.join(', ') || 'Ingen'}</p>
          <p className="text-muted-foreground">Valgte år: {selectedYears.join(', ') || 'Ingen'}</p>
        </div>
      </div>
    </ThemeProvider>
  );
}