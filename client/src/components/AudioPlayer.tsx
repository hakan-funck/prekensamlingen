import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import type { Sermon } from "./SermonCard";

interface AudioPlayerProps {
  sermon: Sermon | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onClose: () => void;
}

export function AudioPlayer({ sermon, isPlaying, onPlayPause, onClose }: AudioPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [sermon]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play();
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
    }
  };

  if (!sermon) return null;

  return (
    <Card className="fixed bottom-0 left-0 right-0 z-50 rounded-none border-t bg-card/95 backdrop-blur-sm">
      <div className="flex items-center gap-4 p-4">
        {/* Audio element */}
        <audio
          ref={audioRef}
          src={sermon.audioUrl}
          onEnded={() => onClose()}
        />

        {/* Sermon Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate" data-testid="text-current-sermon-title">
            {sermon.title}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {sermon.speaker}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => skip(-15)}
            data-testid="button-skip-back"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            size="icon"
            onClick={onPlayPause}
            data-testid="button-play-pause-player"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            size="icon"
            variant="ghost"
            onClick={() => skip(15)}
            data-testid="button-skip-forward"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <span className="text-xs text-muted-foreground w-10">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={duration}
            step={1}
            className="flex-1"
            data-testid="slider-progress"
          />
          <span className="text-xs text-muted-foreground w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleMute}
            data-testid="button-mute"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.1}
            className="w-20"
            data-testid="slider-volume"
          />
        </div>

        {/* Close Button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          data-testid="button-close-player"
        >
          ×
        </Button>
      </div>
    </Card>
  );
}