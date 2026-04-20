const path = require('node:path');
const fs = require('fs/promises');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile)

const BIN_DIR = path.join(__dirname, '..', 'bin');
const YTDLP_PATH = process.platform === 'win32' ? path.join(BIN_DIR, 'yt-dlp.exe') : path.join(BIN_DIR, 'yt-dlp');
//const FFMPEG_PATH = process.platform === 'win32' ? path.join(BIN_DIR, 'ffmpeg.exe') : path.join(BIN_DIR, 'ffmpeg');
const TEMP_DIR = path.join(__dirname, '..', 'temp');

const validYoutubeHosts = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be', 'www.youtu.be'];

function ValidateYoutubeURL(videoURL){
  let url;
  try {
    url = new URL(videoURL);
  } catch {
    return { ok: false, reason: 'That is not a valid YouTube URL.' }
  }

  const host = url.hostname.toLowerCase();
  if (!validYoutubeHosts.includes(host)) {
    return { ok: false, reason: 'That is not a valid YouTube URL.' }
  }

  if (url.searchParams.has('list') || url.pathname.startsWith('/playlist')) {
    return { ok: false, reason: 'Does not support playlists.' }
  }

  const isWatch = url.pathname === '/watch' && url.searchParams.has('v');
  const isShort = url.pathname.startsWith('/shorts/');
  const isLive = url.pathname.startsWith('/live/');
  const isYoutuBe = host.includes('youtu.be') && url.pathname.length > 1;

  if (!isWatch || !isShort || !isLive || !isYoutuBe) {
    return { ok: false, reason: 'Only supports YouTube videos.' }
  }

  return { ok: true }
}

async function GetYoutubeVideoInfo(url) {
  const { stdout } = await execFileAsync(YTDLP_PATH, [
    '--dump-single-json',
    '--skip-download',
    '--no-playlist',
    url,
  ]);

  const info = JSON.parse(stdout);

  return {
    id: info.id ?? null,
    title: info.title ?? null,
    thumbnail: info.thumbnail ?? null,
    duration: info.duration ?? null,
    uploader: info.uploader ?? null,
  };
}

async function DownloadYoutubeAudio(url) {
  await fs.mkdir(TEMP_DIR, { recursive: true });

  const outputTemplate = path.join(TEMP_DIR, '%(id)s.%(ext)s');

  const { stdout, stderr } = await execFileAsync(YTDLP_PATH, [
    '-x',
    '--audio-format', 'mp3',
    '--audio-quality', '0',
    '--ffmpeg-location', BIN_DIR,
    '-o',
    outputTemplate,
    url
  ]);

  // yt-dlp doesn’t directly return filename, so we grab newest file
  const files = await fs.readdir(TEMP_DIR);

  const mp3File = files
    .filter(f => f.endsWith('.mp3'))
    .map(f => ({
      name: f,
      time: fs.stat(path.join(TEMP_DIR, f)).then(s => s.mtimeMs)
    }));

  const resolved = await Promise.all(mp3File);

  resolved.sort((a, b) => b.time - a.time);

  if (!resolved.length) {
    throw new Error('No MP3 file generated');
  }

  return path.join(TEMP_DIR, resolved[0].name);
}

module.exports = { DownloadYoutubeAudio, ValidateYoutubeURL, GetYoutubeVideoInfo }