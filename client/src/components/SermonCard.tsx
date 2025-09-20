import { Play, Pause, Calendar, User, BookOpen, Clock, MapPin, Globe, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Sermon {
  id: string;
  title: string;
  speaker: string;
  date: string;
  bibleText: string;
  duration: string;
  description?: string;
  audioUrl: string;
  sted: string; // Location where sermon was held
  språk: 'no' | 'sv' | 'fi' | 'eng'; // Language abbreviations
  tolk: string; // Interpreter (- if none)
  interpreterName?: string; // Full name of interpreter (for detail view)
  kilde: string; // Source
  annenInfo?: string; // Additional information
}

interface SermonCardProps {
  sermon: Sermon;
  isPlaying: boolean;
  onPlayPause: (sermon: Sermon) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function SermonCard({ 
  sermon, 
  isPlaying, 
  onPlayPause, 
  isExpanded = false, 
  onToggleExpand 
}: SermonCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') {
      return '-';
    }
    
    const date = new Date(dateString);
    
    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}.${month}.${year}`;
  };

  const handleCardClick = () => {
    if (onToggleExpand) {
      onToggleExpand();
    }
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlayPause(sermon);
  };

  return (
    <Card 
      className="hover-elevate cursor-pointer group" 
      data-testid={`card-sermon-${sermon.id}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        {/* Speaker Name as Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {sermon.speaker}
            </h3>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePlayClick}
            className="shrink-0"
            data-testid={`button-play-${sermon.id}`}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Bible Text and Language Info */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-3 w-3 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs">
                {sermon.bibleText}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                <span>Språk: {sermon.språk}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>Tolk: {sermon.tolk}</span>
              </div>
            </div>
          </div>

          {/* Date, Location and Duration */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(sermon.date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span>{sermon.sted}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{sermon.duration}</span>
            </div>
          </div>

          {/* Expand/Collapse Indicator */}
          {onToggleExpand && (
            <div className="flex items-center justify-center pt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <span>{isExpanded ? 'Skjul detaljer' : 'Vis detaljer'}</span>
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </div>
            </div>
          )}

          {/* Expanded Details */}
          {isExpanded && (
            <div className="border-t pt-3 space-y-2 text-sm">
              {sermon.interpreterName && sermon.tolk !== '-' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tolk:</span>
                  <span>{sermon.interpreterName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kilde:</span>
                <span>{sermon.kilde}</span>
              </div>
              {sermon.annenInfo && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Annen info:</span>
                  <span className="text-xs text-muted-foreground">{sermon.annenInfo}</span>
                </div>
              )}
              {/* Play button in expanded view */}
              <div className="pt-2">
                <Button 
                  onClick={handlePlayClick}
                  className="w-full"
                  data-testid={`button-play-expanded-${sermon.id}`}
                >
                  {isPlaying ? (
                    <><Pause className="h-4 w-4 mr-2" /> Pause</>
                  ) : (
                    <><Play className="h-4 w-4 mr-2" /> Spill av</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}