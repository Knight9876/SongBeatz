import React, { useEffect, useState } from "react";
import "./PlayerControls.css";
import { usePlayback } from "../PlayerContext/PlayerContext";

export const PlayerControls: React.FC = () => {
  const { isPlaying, togglePlay, prev, next, audioRef } = usePlayback();
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.currentTime);
      setDuration(isNaN(audio.duration) ? 0 : audio.duration);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateProgress);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateProgress);
    };
  }, [audioRef]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;

    const audio = audioRef.current;
    if (!audio || isNaN(audio.duration) || audio.duration === 0) {
      console.warn("Audio not ready to seek");
      return;
    }

    const newTime = pct * audio.duration;
    audio.currentTime = newTime;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // ✅ Add keyboard listener
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        // Don't handle keys if typing in an input/textarea
        return;
      }

      switch (e.code) {
        case "Space":
          e.preventDefault(); // Prevent scrolling
          togglePlay();
          break;
        case "ArrowLeft":
          prev();
          break;
        case "ArrowRight":
          next();
          break;
        case "ArrowUp":
          {
            const audio = audioRef.current;
            if (audio && !isNaN(audio.duration)) {
              audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
            }
          }
          break;
        case "ArrowDown":
          {
            const audio = audioRef.current;
            if (audio && !isNaN(audio.duration)) {
              audio.currentTime = Math.max(audio.currentTime - 5, 0);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [togglePlay, prev, next, audioRef]);

  return (
    <footer className="player-controls">
      <div className="progress-container" onClick={handleSeek}>
        <div
          className="progress-bar"
          style={{
            width: `${duration ? (progress / duration) * 100 : 0}%`,
          }}
        ></div>

        <div className="time-info">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      <button onClick={prev}>⏮</button>
      <button onClick={togglePlay}>{isPlaying ? "⏸" : "▶"}</button>
      <button onClick={next}>⏭</button>
    </footer>
  );
};
