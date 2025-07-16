import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from "react";

export interface Song {
  name: string;
  path: string;
  albumArt?: string;
  favorite?: boolean;
}

interface PlaybackContextType {
  songs: Song[];
  setSongs: (songs: Song[]) => void;
  playQueue: Song[];
  setPlayQueue: (songs: Song[]) => void;
  currentSong: Song | null;
  setCurrentSong: (song: Song | null) => void;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(
  undefined
);

export const usePlayback = () => {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlayback must be used inside PlaybackProvider");
  return ctx;
};

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playQueue, setPlayQueue] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [_currentSong, _setCurrentSong] = useState<Song | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const currentIndex = _currentSong
    ? playQueue.findIndex((song) => song.path === _currentSong?.path)
    : -1;

  const setCurrentSong = async (song: Song | null) => {
    if (song?.path === _currentSong?.path) {
      console.log("Same song selected, ignoring setCurrentSong");
      return;
    }

    if (song) {
      // Ask main for album art
      const art = await window.electronAPI.getAlbumArt(song.path);
      _setCurrentSong({ ...song, albumArt: art }); // Attach it
      window.electronAPI.saveCurrentSong(song);
      setHasInteracted(true);
    } else {
      _setCurrentSong(null);
    }
  };

  useEffect(() => {
    const loadLastCurrentSong = async () => {
      const lastSong = await window.electronAPI.loadLastCurrentSong();
      if (lastSong) {
        _setCurrentSong(lastSong);
      }
    };

    loadLastCurrentSong();
  }, []);

  const play = () => {
    audioRef.current?.play();
    setIsPlaying(true);
  };

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const next = () => {
    if (playQueue.length === 0) return;
    if (currentIndex >= 0 && currentIndex < playQueue.length - 1) {
      setCurrentSong(playQueue[currentIndex + 1]);
    } else {
      // If at end, maybe loop back to first? Optional:
      setCurrentSong(playQueue[0]);
    }
  };

  const prev = () => {
    if (playQueue.length === 0) return;
    if (currentIndex > 0) {
      setCurrentSong(playQueue[currentIndex - 1]);
    } else {
      // If at start, maybe go to last? Optional:
      setCurrentSong(playQueue[playQueue.length - 1]);
    }
  };

  useEffect(() => {
    if (!audioRef.current || !_currentSong) return;

    const audio = audioRef.current;

    // Create proper music URL (add a hostname to make it valid)
    const musicUrl = `http://localhost:3001/music?path=${encodeURIComponent(
      _currentSong.path
    )}`;
    if (audio.src !== musicUrl) {
      audio.src = musicUrl;
    }

    const handleCanPlay = async () => {
      if (hasInteracted) {
        try {
          await audio.play();
          setIsPlaying(true);
        } catch (error) {
          console.error("Playback error:", error);
          setIsPlaying(false);
        }
      }
    };

    const handleError = () => {
      console.error("Audio loading error:", audio.error);
      setIsPlaying(false);
    };

    const handleEnded = () => {
      next();
    };

    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
      // audio.src = ""; // Clean up audio source
    };
  }, [_currentSong, hasInteracted, next]);

  return (
    <PlaybackContext.Provider
      value={{
        songs,
        setSongs,
        playQueue,
        setPlayQueue,
        currentSong: _currentSong,
        setCurrentSong,
        isPlaying,
        play,
        pause,
        togglePlay,
        next,
        prev,
        audioRef,
      }}
    >
      {children}
      <audio
        ref={audioRef}
        hidden
        onError={(e) => {
          console.error("Audio error:", e.currentTarget.error);
          setIsPlaying(false);
        }}
      />
    </PlaybackContext.Provider>
  );
};
