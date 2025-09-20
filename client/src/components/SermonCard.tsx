import { Play, Pause, Calendar, User, BookOpen, Clock } from "lucide-react";
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
}

interface SermonCardProps {
  sermon: Sermon;
  isPlaying: boolean;
  onPlayPause: (sermon: Sermon) => void;
}

export function SermonCard({ sermon, isPlaying, onPlayPause }: SermonCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nb-NO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <Card className="hover-elevate cursor-pointer group" data-testid={`card-sermon-${sermon.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-lg font-medium line-clamp-2 group-hover:text-primary transition-colors">
              {sermon.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{sermon.speaker}</span>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause(sermon);
            }}
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
          {/* Bible Text */}
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-3 w-3 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {sermon.bibleText}
            </Badge>
          </div>

          {/* Date and Duration */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(sermon.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>{sermon.duration}</span>
            </div>
          </div>

          {/* Description */}
          {sermon.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {sermon.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}