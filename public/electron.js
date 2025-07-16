"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const dotenv = __importStar(require("dotenv"));
const electron_store_1 = __importDefault(require("electron-store"));
const musicServer_1 = require("./musicServer");
const mm = __importStar(require("music-metadata"));
const store = new electron_store_1.default();
const isDev = !electron_1.app.isPackaged;
dotenv.config();
function createWindow() {
    const splashWin = new electron_1.BrowserWindow({
        width: 400,
        height: 300,
        frame: false, // no titlebar
        alwaysOnTop: true,
        transparent: true,
    });
    splashWin.loadFile(path.join(__dirname, "../public/splash.html"));
    const { width, height } = electron_1.screen.getPrimaryDisplay().workAreaSize;
    const mainWin = new electron_1.BrowserWindow({
        width,
        height,
        frame: false,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWin.once("ready-to-show", () => {
        splashWin.close();
        mainWin.show();
    });
    mainWin.setResizable(false);
    // Notify renderer when window is maximized/unmaximized
    mainWin.on("maximize", () => {
        mainWin.webContents.send("window:isMaximized", true);
    });
    mainWin.on("unmaximize", () => {
        mainWin.maximize();
    });
    mainWin.loadURL(isDev
        ? "http://localhost:3000"
        : `file://${path.join(__dirname, "../build/index.html")}`);
}
// Add this BEFORE creating your BrowserWindow
electron_1.protocol.registerSchemesAsPrivileged([
    {
        scheme: "music",
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true, // This is crucial
            stream: true,
            corsEnabled: true,
        },
    },
]);
electron_1.app.whenReady().then(() => {
    (0, musicServer_1.startMusicServer)(3001);
    createWindow();
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("activate", () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
electron_1.ipcMain.on("window:minimize", (e) => {
    const win = electron_1.BrowserWindow.getFocusedWindow();
    win?.minimize();
});
electron_1.ipcMain.on("window:maximize", (e) => {
    const win = electron_1.BrowserWindow.getFocusedWindow();
    if (win?.isMaximized()) {
        win?.unmaximize();
    }
    else {
        win?.maximize();
    }
});
electron_1.ipcMain.on("window:close", (e) => {
    const win = electron_1.BrowserWindow.getFocusedWindow();
    win?.close();
});
electron_1.ipcMain.handle("open-music-folder", async () => {
    const result = await electron_1.dialog.showOpenDialog({
        properties: ["openDirectory"],
    });
    if (result.canceled)
        return [];
    const folderPath = result.filePaths[0];
    // ✅ Save it persistently
    store.set("lastMusicFolder", folderPath);
    const files = fs.readdirSync(folderPath);
    // Filter audio files
    const audioFiles = files
        .filter((file) => file.endsWith(".mp3") ||
        file.endsWith(".wav") ||
        file.endsWith(".flac") ||
        file.endsWith(".m4a"))
        .map((file) => ({
        name: file,
        path: path.join(folderPath, file),
    }));
    return audioFiles;
});
// load last folder
electron_1.ipcMain.handle("load-last-folder", async () => {
    const folderPath = store.get("lastMusicFolder");
    if (!folderPath || !fs.existsSync(folderPath)) {
        return [];
    }
    const files = fs.readdirSync(folderPath);
    const audioFiles = files
        .filter((file) => file.endsWith(".mp3") ||
        file.endsWith(".wav") ||
        file.endsWith(".flac") ||
        file.endsWith(".m4a"))
        .map((file) => ({
        name: file,
        path: path.join(folderPath, file),
    }));
    return audioFiles;
});
// Save current song info
electron_1.ipcMain.handle("save-current-song", (event, song) => {
    store.set("lastCurrentSong", song);
});
// load cuurent song info
electron_1.ipcMain.handle("load-last-current-song", () => {
    return store.get("lastCurrentSong");
});
electron_1.ipcMain.handle("get-album-art", async (event, args) => {
    const filePath = args;
    try {
        const metadata = await mm.parseFile(filePath);
        const picture = metadata.common.picture?.[0];
        if (picture) {
            // Handle both Buffer and ArrayBuffer cases
            let imageData;
            if (picture.data instanceof Buffer) {
                imageData = picture.data;
            }
            else if (picture.data instanceof Uint8Array) {
                imageData = Buffer.from(picture.data);
            }
            else {
                // Handle case where data is in another format
                imageData = Buffer.from(picture.data);
            }
            const base64 = imageData.toString("base64");
            return `data:${picture.format};base64,${base64}`;
        }
        return null;
    }
    catch (error) {
        console.error("Error extracting album art:", error);
        return null;
    }
});
electron_1.ipcMain.handle("get-songs", () => {
    const saved = store.get("songs", []);
    const filtered = saved.filter((song) => fs.existsSync(song.path));
    store.set("songs", filtered); // Optional: overwrite with only existing ones
    return filtered;
});
electron_1.ipcMain.handle("save-songs", (_event, songs) => {
    store.set("songs", songs);
});
electron_1.ipcMain.handle("delete-song", async (_, filePath) => {
    try {
        await fs.promises.unlink(filePath);
        return { success: true };
    }
    catch (err) {
        console.error(err);
        return { success: false, error: err.message };
    }
});
electron_1.ipcMain.handle("get-favorites", () => {
    return store.get("favorites", []); // default empty array
});
electron_1.ipcMain.handle("save-favorites", (_event, favorites) => {
    store.set("favorites", favorites);
});
electron_1.ipcMain.handle("get-playlists", () => {
    return store.get("playlists", []);
});
electron_1.ipcMain.handle("save-playlists", (_event, playlists) => {
    store.set("playlists", playlists);
});
