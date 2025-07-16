import { app, BrowserWindow, ipcMain, dialog, protocol, screen } from "electron";
import * as path from "path";
import * as fs from "fs";
import * as dotenv from "dotenv";
import Store from "electron-store";
import { startMusicServer } from "./musicServer";
import * as mm from "music-metadata";
import { Song } from "../components/PlayerContext/PlayerContext";

const store = new (Store as any)();
const isDev = !app.isPackaged;

dotenv.config();

function createWindow() {
  const splashWin = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false, // no titlebar
    alwaysOnTop: true,
    transparent: true,
  });
  splashWin.loadFile(path.join(__dirname, "../public/splash.html"));

   const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const mainWin = new BrowserWindow({
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

mainWin.loadURL(
  isDev
    ? "http://localhost:3000"
    : `file://${path.join(__dirname, "../build/index.html")}`
);
}

// Add this BEFORE creating your BrowserWindow
protocol.registerSchemesAsPrivileged([
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

app.whenReady().then(() => {
  startMusicServer(3001);
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("window:minimize", (e) => {
  const win = BrowserWindow.getFocusedWindow();
  win?.minimize();
});

ipcMain.on("window:maximize", (e) => {
  const win = BrowserWindow.getFocusedWindow();
  if (win?.isMaximized()) {
    win?.unmaximize();
  } else {
    win?.maximize();
  }
});

ipcMain.on("window:close", (e) => {
  const win = BrowserWindow.getFocusedWindow();
  win?.close();
});

ipcMain.handle(
  "open-music-folder",
  async (): Promise<{ name: string; path: string }[]> => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (result.canceled) return [];

    const folderPath = result.filePaths[0];

    // ✅ Save it persistently
    store.set("lastMusicFolder", folderPath);

    const files = fs.readdirSync(folderPath);

    // Filter audio files
    const audioFiles = files
      .filter(
        (file) =>
          file.endsWith(".mp3") ||
          file.endsWith(".wav") ||
          file.endsWith(".flac") ||
          file.endsWith(".m4a")
      )
      .map((file) => ({
        name: file,
        path: path.join(folderPath, file),
      }));

    return audioFiles;
  }
);

// load last folder
ipcMain.handle("load-last-folder", async () => {
  const folderPath = store.get("lastMusicFolder") as string | undefined;

  if (!folderPath || !fs.existsSync(folderPath)) {
    return [];
  }

  const files = fs.readdirSync(folderPath);

  const audioFiles = files
    .filter(
      (file) =>
        file.endsWith(".mp3") ||
        file.endsWith(".wav") ||
        file.endsWith(".flac") ||
        file.endsWith(".m4a")
    )
    .map((file) => ({
      name: file,
      path: path.join(folderPath, file),
    }));

  return audioFiles;
});

// Save current song info
ipcMain.handle("save-current-song", (event, song) => {
  store.set("lastCurrentSong", song);
});

// load cuurent song info
ipcMain.handle("load-last-current-song", () => {
  return store.get("lastCurrentSong");
});

ipcMain.handle("get-album-art", async (event, args) => {
  const filePath = args as string;

  try {
    const metadata = await mm.parseFile(filePath);
    const picture = metadata.common.picture?.[0];

    if (picture) {
      // Handle both Buffer and ArrayBuffer cases
      let imageData: Buffer;
      if (picture.data instanceof Buffer) {
        imageData = picture.data;
      } else if (picture.data instanceof Uint8Array) {
        imageData = Buffer.from(picture.data);
      } else {
        // Handle case where data is in another format
        imageData = Buffer.from(picture.data as any);
      }

      const base64 = imageData.toString("base64");
      return `data:${picture.format};base64,${base64}`;
    }
    return null;
  } catch (error) {
    console.error("Error extracting album art:", error);
    return null;
  }
});

ipcMain.handle("get-songs", () => {
  const saved = store.get("songs", []);
  const filtered = saved.filter((song: Song) => fs.existsSync(song.path));
  store.set("songs", filtered); // Optional: overwrite with only existing ones
  return filtered;
});

ipcMain.handle("save-songs", (_event, songs) => {
  store.set("songs", songs);
});

ipcMain.handle("delete-song", async (_, filePath) => {
  try {
    await fs.promises.unlink(filePath);
    return { success: true };
  } catch (err: any) {
    console.error(err);
    return { success: false, error: err.message };
  }
});

ipcMain.handle("get-favorites", () => {
  return store.get("favorites", []); // default empty array
});

ipcMain.handle("save-favorites", (_event, favorites) => {
  store.set("favorites", favorites);
});

ipcMain.handle("get-playlists", () => {
  return store.get("playlists", []);
});

ipcMain.handle("save-playlists", (_event, playlists) => {
  store.set("playlists", playlists);
});
