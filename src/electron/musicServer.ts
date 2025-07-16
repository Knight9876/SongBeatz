// src/main/music-server.ts

import express from "express";
import * as fs from "fs";
import * as path from "path";

export function startMusicServer(port = 3001) {
  const app = express();

  app.get("/music", (req, res) => {
    const filePath = decodeURIComponent(req.query.path as string);

    if (!filePath) {
      res.status(400).send("No file path provided");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      {
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".flac": "audio/flac",
        ".m4a": "audio/mp4",
      }[ext] || "audio/mpeg";

    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    if (range) {
      const matches = /bytes=(\d+)-(\d*)/.exec(range);
      if (!matches) {
        res.status(416).send("Invalid Range");
        return;
      }

      const start = parseInt(matches[1], 10);
      const end = matches[2] ? parseInt(matches[2], 10) : stat.size - 1;
      const chunkSize = end - start + 1;
      const stream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": contentType,
      });

      stream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": stat.size,
        "Content-Type": contentType,
      });

      fs.createReadStream(filePath).pipe(res);
    }
  });

  app.listen(port, () => {
    console.log(`🎵 Music server running on http://localhost:${port}/music`);
  });
}
