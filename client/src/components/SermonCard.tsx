import { Play, Pause, Calendar, User, BookOpen, Clock, MapPin, Globe, Users, ChevronDown, ChevronUp, ExternalLink, Share2, Check } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateBibleUrlFromReference } from "@/lib/bibleUrl";
import { generateSermonShareUrl, copyToClipboard } from "@/lib/shareUtils";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export interface Sermon {
  id: string;
  speaker: string; // Contains hyperlink to audio in real data
  date: string; // Can be empty
  bibleBook: string; // e.g., "Matt", "Joh", "Rom"
  bibleChapter: string; // e.g., "5", "10"
  bibleVerses: string; // e.g., "27-30", "1-14"
  språk: 'fi' | 'sv' | 'no' | 'en' | 'ru'; // Language codes
  tolk: string; // Interpreter name or "-"
  tolkTilSpråk: 'fi' | 'sv' | 'no' | 'en' | 'ru' | '-'; // Language interpreted to
  duration: string; // Format like "29:10", "1:02:34"
  sted: string; // Location where sermon was held
  kilde: string; // Source: Kassett, CD, Minnepenn, Youtube, etc.
  annenInfo?: string; // Additional information
  audioUrl: string; // Audio URL from Google Drive
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
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  const formatDate = (dateString: string) => {
    if (!dateString || dateString.trim() === '') {
      return '-';
    }
    
    const trimmed = dateString.trim();
    
    // If it's just a year (4 digits), return as-is
    if (/^\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    
    // If it's dd.mm.yyyy format, return as-is
    if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    
    // Try to parse other formats (ISO dates, etc.)
    const date = new Date(trimmed);
    
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

  const handleBibleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const bibleUrl = generateBibleUrlFromReference(
      sermon.bibleBook,
      sermon.bibleChapter,
      sermon.bibleVerses
    );
    if (bibleUrl) {
      window.open(bibleUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setIsSharing(true);
      const shareUrl = generateSermonShareUrl(sermon);
      await copyToClipboard(shareUrl);
      
      setShareSuccess(true);
      
      toast({
        title: "Lenke kopiert!",
        description: "Prekenlenken er kopiert til utklippstavlen.",
        duration: 3000,
      });
      
      // Reset success state after delay
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (error) {
      console.error('Error sharing sermon:', error);
      toast({
        title: "Kunne ikke kopiere lenke",
        description: "Prøv igjen eller kopier URL-en manuelt.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsSharing(false);
    }
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
            <h3 className="font-serif text-xl sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex items-center gap-2 text-base sm:text-sm">
              <BookOpen className="h-4 w-4 sm:h-3 sm:w-3 text-muted-foreground" />
              <Badge 
                variant="secondary" 
                className="text-sm sm:text-xs cursor-pointer hover:bg-primary/20 transition-colors group/bible"
                onClick={handleBibleClick}
                data-testid={`badge-bible-${sermon.id}`}
              >
                <span className="group-hover/bible:text-primary transition-colors">
                  {sermon.bibleBook} {sermon.bibleChapter}:{sermon.bibleVerses}
                </span>
                <ExternalLink className="h-2 w-2 ml-1 opacity-0 group-hover/bible:opacity-100 transition-opacity" />
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-sm sm:text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4 sm:h-3 sm:w-3" />
                <span>Språk: {sermon.språk}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 sm:h-3 sm:w-3" />
                <span>Tolk: {sermon.tolk === '-' ? '-' : sermon.tolkTilSpråk}</span>
              </div>
            </div>
          </div>

          {/* Date, Location and Duration */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-base sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 sm:h-3 sm:w-3" />
                <span>{formatDate(sermon.date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4 sm:h-3 sm:w-3" />
                <span>{sermon.sted}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 sm:h-3 sm:w-3" />
              <span>{sermon.duration}</span>
            </div>
          </div>

          {/* Expand/Collapse Indicator */}
          {onToggleExpand && (
            <div className="flex items-center justify-center pt-2">
              <div className="flex items-center gap-1 text-sm sm:text-xs text-muted-foreground hover:text-foreground transition-colors">
                <span>{isExpanded ? 'Skjul detaljer' : 'Vis detaljer'}</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 sm:h-3 sm:w-3" />
                ) : (
                  <ChevronDown className="h-4 w-4 sm:h-3 sm:w-3" />
                )}
              </div>
            </div>
          )}

          {/* Expanded Details */}
          {isExpanded && (
            <div className="border-t pt-3 space-y-2 text-base sm:text-sm">
              {sermon.tolk !== '-' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tolk:</span>
                  <span>{sermon.tolk} → {sermon.tolkTilSpråk}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kilde:</span>
                <span>{sermon.kilde}</span>
              </div>
              {sermon.annenInfo && (
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Annen info:</span>
                  <span className="text-sm sm:text-xs text-muted-foreground">{sermon.annenInfo}</span>
                </div>
              )}
              {/* Action buttons in expanded view */}
              <div className="pt-2 space-y-2">
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
                <Button 
                  onClick={handleShareClick}
                  variant="outline"
                  className="w-full"
                  disabled={isSharing || shareSuccess}
                  data-testid={`button-share-${sermon.id}`}
                >
                  {shareSuccess ? (
                    <><Check className="h-4 w-4 mr-2 text-green-600" /> Kopiert!</>
                  ) : isSharing ? (
                    <><div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" /> Kopierer...</>
                  ) : (
                    <><Share2 className="h-4 w-4 mr-2" /> Del</>
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