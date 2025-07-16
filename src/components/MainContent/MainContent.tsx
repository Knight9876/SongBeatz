import React, { useEffect, useState } from "react";
import "./MainContent.css";
import { usePlayback, Song } from "../PlayerContext/PlayerContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faRegularHeart } from "@fortawesome/free-regular-svg-icons";
import {
  faPlus,
  faHeart as faSolidHeart,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import album_art_placeholder from "../../assets/album_art_placeholder.png";
import { useLocation } from "react-router-dom";
import { Playlist } from "../../App";

interface MainContentProps {
  songs: Song[];
  onLoadFolder: () => void;
  onDeleteSong: (song: Song) => void;
  toggleFavorite: (song: Song) => void;
  playlists: Playlist[];
  activePlaylist: Playlist | null; // ✅ single or null
  setActivePlaylist: (playlist: Playlist | null) => void; // ✅ sets Playlist or null
  onCreatePlaylist: (name: string) => void;
  onAddSongToPlaylist: (song: Song, playlistName: string) => void;
  onDeletePlaylist: (name: string) => void;
  onRemoveSongFromPlaylist: (song: Song, playlistName: string) => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  songs,
  onLoadFolder,
  onDeleteSong,
  toggleFavorite,
  playlists = [],
  activePlaylist,
  setActivePlaylist,
  onCreatePlaylist,
  onAddSongToPlaylist,
  onDeletePlaylist,
  onRemoveSongFromPlaylist,
}) => {
  const { currentSong, setCurrentSong, setPlayQueue } = usePlayback();
  const location = useLocation();

  const [createPlaylistShowModal, setCreatePlaylistShowModal] = useState(false);
  const [addToPlaylistShowModal, setAddToPlaylistShowModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [creatingNewInAddModal, setCreatingNewInAddModal] = useState(false);
  const [newPlaylistNameInAddModal, setNewPlaylistNameInAddModal] =
    useState("");

  const currentFullSong = songs.find((s) => s.path === currentSong?.path);
  const isFavorite = currentFullSong?.favorite ?? false;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCreatePlaylistShowModal(false);
        setAddToPlaylistShowModal(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // If focused inside an input or textarea, ignore
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Check for Ctrl key combos
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "f":
            e.preventDefault();
            if (currentSong) toggleFavorite(currentSong);
            break;
          case "p":
            e.preventDefault();
            setAddToPlaylistShowModal(true);
            break;
          case "n":
            e.preventDefault();
            setCreatePlaylistShowModal(true);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [currentSong, toggleFavorite]);

  useEffect(() => {
    if (activePlaylist) {
      setPlayQueue(activePlaylist.songs);
      if (activePlaylist.songs.length > 0) {
        setCurrentSong(activePlaylist.songs[0]); // 👉 set first song from the playlist
      }
    }
  }, [activePlaylist, songs]);

  return (
    <main className="main-content">
      <div className="song-list">
        <h2>
          {location.pathname === "/favorites"
            ? "Favorites"
            : location.pathname === "/playlists"
            ? activePlaylist
              ? `Playlist: ${activePlaylist.name}`
              : "Playlists"
            : "All Songs"}
        </h2>

        {location.pathname === "/playlists" ? (
  activePlaylist ? (
    <>
      <ul>
        {activePlaylist.songs.length > 0 ? (
          activePlaylist.songs.map((song) => (
            <li
              key={song.path}
              className={`song-item ${
                currentSong?.path === song.path ? "active" : ""
              }`}
              onClick={() => {
                if (song.path !== currentSong?.path) {
                  setCurrentSong(song);
                }
              }}
            >
              <span>{song.name}</span>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveSongFromPlaylist(song, activePlaylist.name);
                }}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </li>
          ))
        ) : (
          <li>
            <p>This playlist has no songs yet. Go add some.</p>
          </li>
        )}
      </ul>
      <div className="back-button">
        <button
          className="back-btn"
          onClick={() => setActivePlaylist(null)}
        >
          ⬅ Back to Playlists
        </button>
      </div>
    </>
  ) : playlists.length !== 0 ? (
    <>
      <ul>
        {playlists.map((playlist, index) => (
          <li
            key={index}
            className="playlist-item"
            onClick={() => setActivePlaylist(playlist)}
          >
            {playlist.name} ({playlist.songs.length} songs)
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeletePlaylist(playlist.name);
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </li>
        ))}
      </ul>
      <div className="create-playlist-btn">
        <button
          className="playlist-btn"
          onClick={() => setCreatePlaylistShowModal(true)}
        >
          <FontAwesomeIcon icon={faPlus} />
          &nbsp;Create Playlist
        </button>
      </div>
    </>
  ) : (
    <>
      <p>
        Try adding some by selecting a folder or adding songs to your
        favorites.
      </p>
      <div className="create-playlist-btn">
        <button
          className="playlist-btn"
          onClick={() => setCreatePlaylistShowModal(true)}
        >
          <FontAwesomeIcon icon={faPlus} />
          &nbsp;Create Playlist
        </button>
      </div>
    </>
  )
) : (
  <ul>
    {songs.length !== 0 ? (
      songs.map((song) => (
        <li
          key={song.path}
          onClick={() => {
            if (song.path !== currentSong?.path) {
              setCurrentSong(song);
            }
          }}
          className={`song-item ${
            currentSong?.path === song.path ? "active" : ""
          }`}
        >
          {song.name}
          <button
            className="delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (location.pathname === "/favorites") {
                toggleFavorite(song);
              } else {
                onDeleteSong(song);
              }
            }}
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </li>
      ))
    ) : (
      <p>
        {location.pathname === "/favorites"
          ? "No favorite songs yet. Mark songs as favorites to see them here!"
          : "No songs found."}
      </p>
    )}
  </ul>
)}

      </div>

      <div className="now-playing">
        {currentSong ? (
          <>
            {currentSong?.albumArt ? (
              <img src={currentSong.albumArt} alt="Album Art" />
            ) : (
              <img src={album_art_placeholder} alt="Album Art" />
            )}
            <h1>{currentSong.name}</h1>
            <p>{currentSong.path}</p>
            <div className="cta-btns">
              <button
                className="fav-btn"
                onClick={() => {
                  if (currentSong) toggleFavorite(currentSong);
                }}
              >
                <FontAwesomeIcon
                  icon={isFavorite ? faSolidHeart : faRegularHeart}
                />
              </button>
              <button
                className="playlist-btn"
                onClick={() => setAddToPlaylistShowModal(true)}
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <p>No song selected.</p>
            <button onClick={onLoadFolder}>Load Music Folder</button>
          </div>
        )}
      </div>

      {/* ✅ Create Playlist Modal */}
      {createPlaylistShowModal && (
        <>
          <div className="overlay"></div>
          <div className="modal">
            <h1>Create Playlist</h1>
            <input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Enter playlist name"
            />
            <button
              onClick={() => {
                if (newPlaylistName.trim()) {
                  onCreatePlaylist(newPlaylistName);
                  setCreatePlaylistShowModal(false);
                  setNewPlaylistName("");
                }
              }}
            >
              Create
            </button>
            <button onClick={() => setCreatePlaylistShowModal(false)}>
              Cancel
            </button>
          </div>
        </>
      )}

      {/* ✅ Add To Playlist Modal */}
      {addToPlaylistShowModal && currentSong && (
        <>
          <div className="overlay"></div>
          <div className="modal">
            <h1>Add to Playlist</h1>
            <div className="playlist-list">
              {playlists.length > 0 ? (
                playlists.map((playlist) => (
                  <div
                    key={playlist.name}
                    className="playlist-item"
                    onClick={() => {
                      onAddSongToPlaylist(currentSong, playlist.name);
                      setAddToPlaylistShowModal(false);
                    }}
                  >
                    {playlist.name}
                  </div>
                ))
              ) : (
                <p>No playlists yet.</p>
              )}
            </div>

            {creatingNewInAddModal ? (
              <>
                <input
                  value={newPlaylistNameInAddModal}
                  onChange={(e) => setNewPlaylistNameInAddModal(e.target.value)}
                  placeholder="New playlist name"
                />
                <button
                  onClick={() => {
                    if (newPlaylistNameInAddModal.trim()) {
                      console.log(newPlaylistNameInAddModal);

                      onCreatePlaylist(newPlaylistNameInAddModal);
                      onAddSongToPlaylist(
                        currentSong,
                        newPlaylistNameInAddModal
                      );
                      setCreatingNewInAddModal(false);
                      setAddToPlaylistShowModal(false);
                      setNewPlaylistNameInAddModal("");
                    }
                  }}
                >
                  Create & Add
                </button>
              </>
            ) : (
              <button onClick={() => setCreatingNewInAddModal(true)}>
                Create New Playlist
              </button>
            )}

            <button onClick={() => setAddToPlaylistShowModal(false)}>
              Close
            </button>
          </div>
        </>
      )}
    </main>
  );
};
