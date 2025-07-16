import { contextBridge, ipcRenderer } from "electron";
import { Song } from "../components/PlayerContext/PlayerContext";

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window:minimize"),

  maximize: () => ipcRenderer.send("window:maximize"),

  close: () => ipcRenderer.send("window:close"),

  onMaximize: (callback: (isMaximized: boolean) => void) => {
    const listener = (_: any, isMaximized: boolean) => callback(isMaximized);
    ipcRenderer.on("window:isMaximized", listener);
    return () => ipcRenderer.removeListener("window:isMaximized", listener);
  },

  openMusicFolder: () => ipcRenderer.invoke("open-music-folder"),

  loadLastFolder: () => ipcRenderer.invoke("load-last-folder"),

  saveCurrentSong: (song: { name: string; path: string }) =>
    ipcRenderer.invoke("save-current-song", song),

  loadLastCurrentSong: () => ipcRenderer.invoke("load-last-current-song"),

  getAlbumArt: (filePath: string) =>
    ipcRenderer.invoke("get-album-art", filePath),

  getSongs: () => ipcRenderer.invoke("get-songs"),

  saveSongs: (songs: Song[]) => ipcRenderer.invoke("save-songs", songs),

  deleteSong: (filePath: string) => ipcRenderer.invoke("delete-song", filePath),

  getFavorites: () => ipcRenderer.invoke("get-favorites"),

  saveFavorites: (favorites: Song[]) =>
    ipcRenderer.invoke("save-favorites", favorites),

  getPlaylists: () => ipcRenderer.invoke("get-playlists"),

  savePlaylists: (playlists: any) => ipcRenderer.invoke("save-playlists", playlists),
});
