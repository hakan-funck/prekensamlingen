import { useState } from 'react';
import { FilterPanel } from '../FilterPanel';

export default function FilterPanelExample() {
  const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  
  const speakers = ['Ola Nordmann', 'Kari Hansen', 'Per Andersen', 'Anne Olsen'];
  const years = [2024, 2023, 2022, 2021, 2020];
  const activeFiltersCount = selectedSpeakers.length + selectedYears.length;

  return (
    <div className="p-4">
      <FilterPanel
        speakers={speakers}
        selectedSpeakers={selectedSpeakers}
        onSpeakersChange={setSelectedSpeakers}
        years={years}
        selectedYears={selectedYears}
        onYearsChange={setSelectedYears}
        activeFiltersCount={activeFiltersCount}
      />
    </div>
  );
}