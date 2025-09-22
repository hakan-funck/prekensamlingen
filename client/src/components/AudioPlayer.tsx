import { useState, useRef, useEffect } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [playbackRate, setPlaybackRate] = useState('1');
  const audioRef = useRef<HTMLAudioElement>(null);
  const canplayHandlerRef = useRef<(() => void) | null>(null);
  const desiredPlayingRef = useRef(false);
  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      console.log('AudioPlayer: Duration loaded:', audio.duration);
      setDuration(audio.duration);
    };
    const handleError = (e: Event) => {
      console.error('AudioPlayer: Audio error event:', e);
      console.error('AudioPlayer: Audio error details:', audio.error);
      console.error('AudioPlayer: Audio src:', audio.src);
      console.error('AudioPlayer: Audio network state:', audio.networkState);
      console.error('AudioPlayer: Audio ready state:', audio.readyState);
    };
    const handleLoadStart = () => {
      console.log('AudioPlayer: Audio load started for:', sermon?.speaker);
      console.log('AudioPlayer: Audio src:', audio.src);
    };
    const handleCanPlay = () => {
      console.log('AudioPlayer: Audio can play for:', sermon?.speaker);
      console.log('AudioPlayer: Audio ready state:', audio.readyState);
      console.log('AudioPlayer: Audio duration:', audio.duration);
    };
    const handlePlay = () => {
      console.log('AudioPlayer: Audio play event fired');
    };
    const handlePause = () => {
      console.log('AudioPlayer: Audio pause event fired');
    };
    const handleWaiting = () => {
      console.log('AudioPlayer: Audio waiting (buffering)');
    };
    const handleCanPlayThrough = () => {
      console.log('AudioPlayer: Audio can play through (fully loaded)');
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
    };
  }, [sermon]);

  // Keep track of desired playing state to prevent race conditions
  useEffect(() => {
    desiredPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Effect A: Handle source changes only
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !sermon?.audioUrl) return;

    // Only reset if URL actually changed
    if (sermon.audioUrl !== lastUrlRef.current) {
      lastUrlRef.current = sermon.audioUrl;
      audio.pause();
      audio.currentTime = 0;
      setCurrentTime(0);
      setDuration(0);
      
      // Clean up any pending canplay handler on source change
      if (canplayHandlerRef.current) {
        audio.removeEventListener('canplay', canplayHandlerRef.current);
        canplayHandlerRef.current = null;
      }
      
      console.log('AudioPlayer: Reset state for new source:', sermon.audioUrl);
    }
  }, [sermon?.audioUrl]);

  // Effect B: Handle play/pause state only  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      console.log('AudioPlayer: No audio element reference');
      return;
    }

    console.log('AudioPlayer: isPlaying changed to:', isPlaying);
    console.log('AudioPlayer: Audio readyState:', audio.readyState);
    console.log('AudioPlayer: Audio paused:', audio.paused);
    console.log('AudioPlayer: Audio current time:', audio.currentTime);

    if (isPlaying) {
      // Ensure audio is ready before attempting to play
      if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
        console.log('AudioPlayer: Attempting to play audio');
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('AudioPlayer: Play started successfully');
            })
            .catch(error => {
              console.error('AudioPlayer: Play failed:', error);
              console.error('AudioPlayer: Audio error code:', audio.error?.code);
              console.error('AudioPlayer: Audio error message:', audio.error?.message);
              // Call onPlayPause to sync the UI state
              onPlayPause();
            });
        }
      } else {
        console.log('AudioPlayer: Audio not ready, waiting for canplay event');
        
        // Clean up any existing canplay handler
        if (canplayHandlerRef.current) {
          audio.removeEventListener('canplay', canplayHandlerRef.current);
        }
        
        const onCanPlay = () => {
          console.log('AudioPlayer: Audio ready, now attempting to play');
          
          // Check if still desired to be playing and source hasn't changed (prevent races)
          if (!desiredPlayingRef.current) {
            console.log('AudioPlayer: No longer playing, skipping delayed play');
            return;
          }
          if (audio.src !== lastUrlRef.current) {
            console.log('AudioPlayer: Source changed, skipping delayed play');
            return;
          }
          
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('AudioPlayer: Delayed play started successfully');
              })
              .catch(error => {
                console.error('AudioPlayer: Delayed play failed:', error);
                onPlayPause();
              });
          }
          canplayHandlerRef.current = null;
        };
        
        canplayHandlerRef.current = onCanPlay;
        audio.addEventListener('canplay', onCanPlay, { once: true });
      }
    } else {
      console.log('AudioPlayer: Pausing audio');
      audio.pause();
      
      // Clean up any pending canplay handler when pausing
      if (canplayHandlerRef.current) {
        audio.removeEventListener('canplay', canplayHandlerRef.current);
        canplayHandlerRef.current = null;
      }
    }
    
    // Cleanup function for when effect re-runs or component unmounts
    return () => {
      if (canplayHandlerRef.current && audioRef.current) {
        audioRef.current.removeEventListener('canplay', canplayHandlerRef.current);
        canplayHandlerRef.current = null;
      }
    };
  }, [isPlaying, onPlayPause, sermon?.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = parseFloat(playbackRate);
    }
  }, [playbackRate]);

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
          crossOrigin="anonymous"
          preload="metadata"
          onEnded={() => onClose()}
        />

        {/* Sermon Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate" data-testid="text-current-sermon-title">
            {sermon.speaker} - {sermon.bibleBook} {sermon.bibleChapter}:{sermon.bibleVerses}
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

        {/* Playback Speed */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              data-testid="button-playback-speed"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Avspillingshastighet</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup 
              value={playbackRate} 
              onValueChange={setPlaybackRate}
            >
              <DropdownMenuRadioItem value="0.75">0.75x</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="1">1x (Normal)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="1.25">1.25x</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="1.5">1.5x</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="2">2x</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

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