import React from "react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";

export const Sidebar: React.FC<{ setActiveView: (view: 'all' | 'playlists' | 'favorites') => void }> = ({ setActiveView }) => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <h1>🎧</h1>
        <span>SongBeatz</span>
      </div>
      <h2>Library</h2>
      <ul>
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={() => setActiveView('all')}
        >
          <li>🎵 All Songs</li>
        </NavLink>
        <NavLink
          to="/playlists"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={() => setActiveView('playlists')}
        >
          <li>📁 Playlists</li>
        </NavLink>
        <NavLink
          to="/favorites"
          className={({ isActive }) => (isActive ? "active" : "")}
          onClick={() => setActiveView('favorites')}
        >
          <li>❤️ Favorites</li>
        </NavLink>
      </ul>
    </aside>
  );
};
