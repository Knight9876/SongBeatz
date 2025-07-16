"use strict";
// src/main/music-server.ts
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
exports.startMusicServer = startMusicServer;
const express_1 = __importDefault(require("express"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function startMusicServer(port = 3001) {
    const app = (0, express_1.default)();
    app.get("/music", (req, res) => {
        const filePath = decodeURIComponent(req.query.path);
        if (!filePath) {
            res.status(400).send("No file path provided");
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = {
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
        }
        else {
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
