import React, { useCallback, useEffect, useState } from "react";
import "./App.css";
import { TitleBar } from "./components/TitleBar/TitleBar";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { MainContent } from "./components/MainContent/MainContent";
import { PlayerControls } from "./components/PlayerControls/PlayerControls";
import {
  PlaybackProvider,
  Song,
  usePlayback,
} from "./components/PlayerContext/PlayerContext";
import { Route, Routes } from "react-router-dom";

export interface Playlist {
  name: string;
  songs: Song[];
}

export function AppContent() {
  const { songs, setSongs, setPlayQueue } = usePlayback();
  const [activeView, setActiveView] = useState<
    "all" | "playlists" | "favorites"
  >("all");
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);

  useEffect(() => {
    const loadPlaylists = async () => {
      const storedPlaylists = await window.electronAPI.getPlaylists();
      setPlaylists(storedPlaylists);
    };
    loadPlaylists();
  }, []);

  const handleCreatePlaylist = (name: string) => {
    setPlaylists((prev) => {
      const exists = prev.some(
        (p) => p.name.toLowerCase() === name.toLowerCase()
      );
      if (exists) {
        console.log(`Playlist "${name}" already exists.`);
        return prev; // Do not add duplicate
      }
      const newPlaylist = { name, songs: [] };
      const updated = [...prev, newPlaylist];
      window.electronAPI.savePlaylists(updated);
      return updated;
    });
  };

  const handleAddSongToPlaylist = (song: Song, playlistName: string) => {
    setPlaylists((prev) => {
      const updated = prev.map((playlist) =>
        playlist.name === playlistName
          ? {
              ...playlist,
              songs: playlist.songs.find((s: Song) => s.path === song.path)
                ? playlist.songs
                : [...playlist.songs, song],
            }
          : playlist
      );
      window.electronAPI.savePlaylists(updated);
      return updated;
    });
  };

  const handleDeletePlaylist = (playlistName: string) => {
    const updated = playlists.filter((p) => p.name !== playlistName);
    setPlaylists(updated);
    window.electronAPI.savePlaylists(updated);

    // If you’re viewing this playlist, exit it
    if (activePlaylist?.name === playlistName) {
      setActivePlaylist(null);
    }
  };

  const handleRemoveSongFromPlaylist = (song: Song, playlistName: string) => {
    const updated = playlists.map((playlist) =>
      playlist.name === playlistName
        ? {
            ...playlist,
            songs: playlist.songs.filter((s: Song) => s.path !== song.path),
          }
        : playlist
    );
    setPlaylists(updated);
    window.electronAPI.savePlaylists(updated);

    // Also update active if needed:
    if (activePlaylist?.name === playlistName) {
      setActivePlaylist({
        ...activePlaylist,
        songs: activePlaylist.songs.filter((s: Song) => s.path !== song.path),
      });
    }
  };

  useEffect(() => {
    (async () => {
      const allSongs = await window.electronAPI.getSongs(); // ✅ filtered on disk
      const favorites = await window.electronAPI.getFavorites();

      if (activeView === "favorites") {
        const validFavorites = favorites.filter((fav) =>
          allSongs.find((s) => s.path === fav.path)
        );
        setSongs(validFavorites);
      } else {
        setSongs(allSongs);
      }
    })();
  }, [activeView, setSongs]);

  const handleLoadFolder = useCallback(async () => {
    const result = await window.electronAPI.openMusicFolder();
    const updated = result.map((newSong) => {
      const existing = songs.find((s) => s.path === newSong.path);
      return existing
        ? { ...newSong, favorite: existing.favorite }
        : { ...newSong, favorite: false };
    });
    setSongs(updated);
    window.electronAPI.saveSongs(updated);
  }, [songs, setSongs]);

  const handleDeleteSong = async (song: Song) => {
    const confirm = window.confirm(`Delete ${song.name} permanently?`);
    if (!confirm) return;

    const result = await window.electronAPI.deleteSong(song.path);

    if (result.success) {
      const updatedSongs = songs.filter((s) => s.path !== song.path);
      setSongs(updatedSongs);
      window.electronAPI.saveSongs(updatedSongs);
    } else {
      alert(`Failed to delete: ${result.error}`);
    }
  };

  const toggleFavorite = (song: Song) => {
    const updated = songs.map((s) =>
      s.path === song.path ? { ...s, favorite: !s.favorite } : s
    );
    setSongs(updated);
    window.electronAPI.saveFavorites(updated);
  };

  const displayedSongs =
    activeView === "favorites" ? songs.filter((s) => s.favorite) : songs;

  useEffect(() => {
    if (activeView === "favorites") {
      setPlayQueue(songs.filter((song) => song.favorite));
    } else if (activeView === "playlists" && activePlaylist) {
      setPlayQueue(activePlaylist.songs);
    } else {
      setPlayQueue(songs);
    }
  }, [activeView, songs, activePlaylist, setPlayQueue]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // If focused in an input or textarea, ignore
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Ctrl/Cmd + O → Open folder
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        handleLoadFolder();
        setSongs([]);
        return;
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [handleLoadFolder, setSongs]);

  return (
    <div className="app-container">
      <TitleBar />
      <div className="app-body">
        <Sidebar setActiveView={setActiveView} />
        <Routes>
          <Route
            path="/"
            element={
              <MainContent
                songs={displayedSongs}
                onLoadFolder={handleLoadFolder}
                onDeleteSong={handleDeleteSong}
                toggleFavorite={toggleFavorite}
                playlists={playlists}
                activePlaylist={activePlaylist}
                setActivePlaylist={setActivePlaylist}
                onCreatePlaylist={handleCreatePlaylist}
                onAddSongToPlaylist={handleAddSongToPlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onRemoveSongFromPlaylist={handleRemoveSongFromPlaylist}
              />
            }
          />
          <Route
            path="/playlists"
            element={
              <MainContent
                songs={displayedSongs}
                onLoadFolder={handleLoadFolder}
                onDeleteSong={handleDeleteSong}
                toggleFavorite={toggleFavorite}
                playlists={playlists}
                activePlaylist={activePlaylist}
                setActivePlaylist={setActivePlaylist}
                onCreatePlaylist={handleCreatePlaylist}
                onAddSongToPlaylist={handleAddSongToPlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onRemoveSongFromPlaylist={handleRemoveSongFromPlaylist}
              />
            }
          />
          <Route
            path="/favorites"
            element={
              <MainContent
                songs={displayedSongs}
                onLoadFolder={handleLoadFolder}
                onDeleteSong={handleDeleteSong}
                toggleFavorite={toggleFavorite}
                playlists={playlists}
                activePlaylist={activePlaylist}
                setActivePlaylist={setActivePlaylist}
                onCreatePlaylist={handleCreatePlaylist}
                onAddSongToPlaylist={handleAddSongToPlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onRemoveSongFromPlaylist={handleRemoveSongFromPlaylist}
              />
            }
          />
        </Routes>
      </div>
      <PlayerControls />
    </div>
  );
}

// ✅ The root wraps the inside with the Provider:
export default function App() {
  return (
    <PlaybackProvider>
      <AppContent />
    </PlaybackProvider>
  );
}
