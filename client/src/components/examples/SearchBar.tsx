import { useState } from 'react';
import { SearchBar } from '../SearchBar';

export default function SearchBarExample() {
  const [value, setValue] = useState('');

  return (
    <div className="p-4 max-w-2xl">
      <SearchBar 
        value={value} 
        onChange={setValue}
        placeholder="Søk prekener, taler, bibeltekster..."
      />
    </div>
  );
}