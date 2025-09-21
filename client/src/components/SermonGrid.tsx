import { useState } from "react";
import { SermonCard, type Sermon } from "./SermonCard";

interface SermonGridProps {
  sermons: Sermon[];
  currentSermon: Sermon | null;
  isPlaying: boolean;
  onPlayPause: (sermon: Sermon) => void;
}

export function SermonGrid({ sermons, currentSermon, isPlaying, onPlayPause }: SermonGridProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const handleToggleExpand = (sermonId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sermonId)) {
        newSet.delete(sermonId);
      } else {
        newSet.add(sermonId);
      }
      return newSet;
    });
  };

  if (sermons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="max-w-md">
          <h3 className="text-lg font-medium text-foreground mb-2">
            Ingen prekener funnet
          </h3>
          <p className="text-muted-foreground">
            Prøv å justere søket eller filtrene dine for å finne prekener.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" data-testid="grid-sermons">
      {sermons.map((sermon) => (
        <SermonCard
          key={sermon.id}
          sermon={sermon}
          isPlaying={currentSermon?.id === sermon.id && isPlaying}
          onPlayPause={onPlayPause}
          isExpanded={expandedCards.has(sermon.id)}
          onToggleExpand={() => handleToggleExpand(sermon.id)}
        />
      ))}
    </div>
  );
}