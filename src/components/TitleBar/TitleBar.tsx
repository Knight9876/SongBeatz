import React, { useEffect, useState } from "react";
import "./TitleBar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSquare } from "@fortawesome/free-regular-svg-icons";
import { faMinus, faTimes, faKeyboard } from "@fortawesome/free-solid-svg-icons";

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const unsubscribe = window.electronAPI.onMaximize(setIsMaximized);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showShortcuts) {
        handleCloseModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts]);

  const handleCloseModal = () => {
    setClosing(true);
    setTimeout(() => {
      setShowShortcuts(false);
      setClosing(false);
    }, 300); // match CSS animation duration
  };

  return (
    <>
      <div className="titlebar">
        <div className="drag-region">🎧 SongBeatz</div>
        <div className="window-controls">
          <button
            className="shortcuts-btn"
            onClick={() => setShowShortcuts(true)}
            title="Keyboard Shortcuts"
          >
            <FontAwesomeIcon icon={faKeyboard} />
          </button>
          <button onClick={() => window.electronAPI.minimize()}>
            <FontAwesomeIcon icon={faMinus} />
          </button>
          <button onClick={() => window.electronAPI.maximize()}>
            {isMaximized ? "❐" : <FontAwesomeIcon icon={faSquare} />}
          </button>
          <button className="close" onClick={() => window.electronAPI.close()}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
      </div>

      {showShortcuts && (
        <div className={`shortcuts-modal ${closing ? "closing" : ""}`}>
          <div className="shortcuts-content">
            <h2>Keyboard Shortcuts</h2>
            <ul>
              <li><strong>Space</strong> — Play/Pause</li>
              <li><strong>Left Arrow</strong> — Previous Song</li>
              <li><strong>Right Arrow</strong> — Next Song</li>
              <li><strong>Up Arrow</strong> — Seek Forward</li>
              <li><strong>Down Arrow</strong> — Seek Backward</li>
              <li><strong>Ctrl/Cmd + F</strong> — Toggle Favorite</li>
              <li><strong>Ctrl/Cmd + P</strong> — Add to Playlist</li>
              <li><strong>Ctrl/Cmd + N</strong> — Create Playlist</li>
              <li><strong>Ctrl/Cmd + O</strong> — Open Folder</li>
              <li><strong>ESC</strong> — Close Modals</li>
            </ul>
            <button
              className="close-shortcuts-btn"
              onClick={handleCloseModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
