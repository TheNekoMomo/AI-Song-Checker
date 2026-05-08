# AI Song Checker Bot

A Discord bot that checks songs for AI.

## Prerequisites

Before setting up this bot, ensure you have:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- A **Discord Server** for testing the bot
- A **MongoDB Atlas** account - [Sign up](https://www.mongodb.com/cloud/atlas)
- **FFmpeg** - Required for audio processing - [Download](https://ffmpeg.org/download.html)
- **yt-dlp** - Required for YouTube integration - [Download](https://github.com/yt-dlp/yt-dlp/releases)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AI-Song-Checker
```

### 2. Create a Development Branch

```bash
git checkout -b setup-local
```

This keeps your local setup separate from the main branch.

### 3. Install Dependencies

```bash
npm install
```

### 4. Create Configuration Files

#### `.env` File

Create a `.env` file in the root directory with the following variables:

```env
DISCORD_TOKEN=your_discord_token
MONGODB_URI=your_mongodb_connection_string
GUILD_ID=your_test_guild_id
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
ACCOUNT_ID=your_cloudflare_account_id
ACCESS_KEY_ID=your_cloudflare_access_key_id
SECRET_ACCESS_KEY=your_cloudflare_secret_access_key
SH_LABS_APIKEY=your_submithub_labs_api_key
```

**Note:** Do not commit this file - it's already in `.gitignore`

#### `.local_marker` File

Create an empty `.local_marker` file in the root directory to mark this as a local development environment:

```bash
touch .local_marker
```

This makes the bot only register the commands to a single guild

#### Download External Binaries

The `bin/` folder requires two executable files that you must download manually based on your operating system:

##### FFmpeg
[Download from ffmpeg.org](https://ffmpeg.org/download.html) - Choose the build for your OS:

- **Windows**: Download the Windows build, extract it, and place `ffmpeg.exe` in the `bin/` folder
- **macOS**: Use Homebrew: `brew install ffmpeg` (or download from ffmpeg.org)
- **Linux**: Use your package manager:
  - Ubuntu/Debian: `sudo apt-get install ffmpeg`
  - Fedora: `sudo dnf install ffmpeg`
  - Arch: `sudo pacman -S ffmpeg`

Used for audio processing and format conversion.

##### yt-dlp
[Download from yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases) - Choose the build for your OS:

- **Windows**: Download `yt-dlp.exe` and place it in the `bin/` folder
- **macOS**: Use Homebrew: `brew install yt-dlp` (or download the macOS binary)
- **Linux**: Download the Linux binary or use: `pip install yt-dlp`

Used for downloading and processing YouTube videos.

After downloading/installing, your `bin/` folder should contain:
```
bin/
├── ffmpeg (or ffmpeg.exe on Windows)
└── yt-dlp (or yt-dlp.exe on Windows)
```

**Note:** These files are listed in `.gitignore` and won't be committed to the repository.

---

## Obtaining API Keys & Credentials

### Discord Token
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name
3. Go to the **"Bot"** tab
4. Click **"Add Bot"**
5. Under **TOKEN**, click **"Copy"** to copy your bot token
6. **⚠️ NEVER share this token** - it's like a password for your bot

### Guild ID (Server ID)
1. In Discord, enable **Developer Mode**: User Settings → Advanced → Developer Mode
2. Right-click your server name → **"Copy Server ID"**

### MongoDB URI
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Click **"Connect"** on your cluster
4. Choose **"Drivers"** and select Node.js
5. Copy the connection string and replace `<password>` with your database password
6. Your URI should look like: `mongodb+srv://username:password@cluster.mongodb.net/dbname`

### Spotify API Keys
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in or create a Spotify account
3. Create a new app and accept the terms
4. You'll get:
   - **Client ID**
   - **Client Secret** (⚠️ Keep this secret!)
5. Copy these to your `.env` file

### Cloudflare API Keys
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Log in to your account
3. Go to **Account Settings** → **API Tokens** or **Account → Workers**
4. Create an API token with R2 (storage) permissions, or use your API key
5. Get your:
   - **Account ID** (from Account overview or Workers page)
   - **Access Key ID** (from R2 API Tokens section)
   - **Secret Access Key** (from R2 API Tokens section)

### SubmitHub Labs API Key
1. Go to [SubmitHub Labs](https://shlabs.music/)
2. Create an account or log in
3. Generate an API key in your account settings
4. Copy the key to `SH_LABS_APIKEY` in your `.env` file

---

## Running the Bot

```bash
node index.js
```

Your bot should now connect to Discord and MongoDB. You'll see:
- Public IP address logged to console
- Database connection confirmation
- Bot login status

## Project Structure

```
├── bin/                   # External executables (NOT committed)
│   ├── ffmpeg.exe         # Audio processing tool
│   └── yt-dlp.exe         # YouTube downloader
├── commands/              # Discord slash commands
│   ├── admin/             # Admin-only commands
│   └── checking/          # Song checking commands
├── events/                # Discord event handlers
├── mongoose/              # Database configuration
│   ├── DatabaseConnect.js # MongoDB connection
│   └── models/            # Database models
├── utility/               # Utility functions
│   ├── SpotifyHelper.js   # Spotify API integration
│   ├── CloudflareStorage.js # File storage
│   ├── SubmitHubAPI.js    # SubmitHub integration
│   └── YoutubeHelper.js   # YouTube integration
├── .env                   # Environment variables (NOT committed)
├── .local_marker          # Local development marker (NOT committed)
└── whiteList.json         # Guild whitelist (committed)
```

## Environment Files in `.gitignore`

The following files are intentionally not tracked by git:
- `.env` - Sensitive API keys and credentials
- `.local_marker` - Local development marker

These are listed in `.gitignore` to prevent accidentally committing sensitive information.

## Troubleshooting

**Bot won't connect to Discord:**
- Verify your `DISCORD_TOKEN` is correct
- Check that your bot has been added to your test server with proper permissions

**MongoDB connection fails:**
- Verify your `MONGODB_URI` is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure the database user has proper permissions

**Commands not showing up:**
- Make sure `.local_marker` exists in your root directory
- Verify your `GUILD_ID` matches your test server
- Restart the bot after adding/modifying commands

## License

MIT
