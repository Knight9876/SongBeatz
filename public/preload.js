"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld("electronAPI", {
    minimize: () => electron_1.ipcRenderer.send("window:minimize"),
    maximize: () => electron_1.ipcRenderer.send("window:maximize"),
    close: () => electron_1.ipcRenderer.send("window:close"),
    onMaximize: (callback) => {
        const listener = (_, isMaximized) => callback(isMaximized);
        electron_1.ipcRenderer.on("window:isMaximized", listener);
        return () => electron_1.ipcRenderer.removeListener("window:isMaximized", listener);
    },
    openMusicFolder: () => electron_1.ipcRenderer.invoke("open-music-folder"),
    loadLastFolder: () => electron_1.ipcRenderer.invoke("load-last-folder"),
    saveCurrentSong: (song) => electron_1.ipcRenderer.invoke("save-current-song", song),
    loadLastCurrentSong: () => electron_1.ipcRenderer.invoke("load-last-current-song"),
    getAlbumArt: (filePath) => electron_1.ipcRenderer.invoke("get-album-art", filePath),
    getSongs: () => electron_1.ipcRenderer.invoke("get-songs"),
    saveSongs: (songs) => electron_1.ipcRenderer.invoke("save-songs", songs),
    deleteSong: (filePath) => electron_1.ipcRenderer.invoke("delete-song", filePath),
    getFavorites: () => electron_1.ipcRenderer.invoke("get-favorites"),
    saveFavorites: (favorites) => electron_1.ipcRenderer.invoke("save-favorites", favorites),
    getPlaylists: () => electron_1.ipcRenderer.invoke("get-playlists"),
    savePlaylists: (playlists) => electron_1.ipcRenderer.invoke("save-playlists", playlists),
});
