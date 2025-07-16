export {};

declare global {
  type Song = {
    name: string;
    path: string;
    albumArt?: string;
    favorite?: boolean;
  }

  interface Window {
    electronAPI: {
      minimize: () => void;

      maximize: () => void;

      close: () => void;

      onMaximize: (callback: (isMaximized: boolean) => void) => () => void;

      openMusicFolder: () => Promise<{ name: string; path: string }[]>;

      loadLastFolder: () => Promise<{ name: string; path: string }[]>;

      saveCurrentSong: (song: { name: string; path: string }) => Promise<void>;

      loadLastCurrentSong: () => Promise<{ name: string; path: string } | null>;

      getAlbumArt: (filePath: string) => Promise<string>;

      getSongs: () => Promise<Song[]>;

      saveSongs: (songs: Song[]) => void;

      deleteSong: (
        filePath: string
      ) => Promise<{ success: boolean; error?: string }>;

      getFavorites: () => Promise<Song[]>;

      saveFavorites: (songs: Song[]) => void;

      getPlaylists: () => Promise<any[]>;

      savePlaylists: (playlists: any[]) => void;
    };
  }
}
