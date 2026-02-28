# AI Song Checker

Discord bot that evaluates whether a Spotify song has been generated
or processed by artificial intelligence using the SH Labs API.  Aside
from its guild configuration helpers, the only user-facing command is
`/check-song`.

---

## Features

* `/check-song` – analyze a Spotify track URL and receive a spectral
  probability report (human / processed AI / pure AI).
* Configuration commands to restrict bot usage to specific channels.
* Automatic command registration to the `testServer` guild when the
  local `.local_marker` file is present or when `TEST_BUILD` is enabled.
* Mongoose-based persistence for guild settings.
* Color-customized embeds derived from album art.
* Development helpers: local environment detection, sampling of API
  response times, performance metrics printed to embed footers.

---

## Installation

```bash
git clone https://github.com/TheNekoMomo/AI-Song-Checker.git
cd "AI-Song-Checker"
npm install
cp .env.example .env    # populate required variables below
```

### Required environment variables

| Name             | Purpose                                 |
|------------------|-----------------------------------------|
| `DISCORD_TOKEN`  | Discord bot token                       |
| `SH_LABS_APIKEY` | API key for SH Labs music detection     |
| `MONGODB_URI`    | MongoDB connection string (optional)    |
| `TEST_BUILD`     | `true` to force test-server behavior    |

The first two are mandatory; the others are optional or situational.


## Local development

1. Create a marker file to distinguish your machine from a server:
   ```bash
   touch .local_marker
   # ensure `.local_marker` is listed in `.gitignore` (already is)
   ```
2. The bot reads this marker via `src/utils/environment.js` and
   provides `isLocal()` for conditional logic.

3. Run tests:
   ```bash
   npm test
   ```

4. Start with `npm start` or `node src/index.js`.


## Command registration

On startup, the `01registerCommands.js` handler compares local
command definitions with registered application commands.  When
running locally (or with `TEST_BUILD=true`), commands are registered to
the `testServer` guild defined in `config.json` instead of globally.


## Guild configuration

The bot persists `GuildConfig` documents in MongoDB.  You can limit the
channels where the bot will respond by using the moderation commands
(`/add-command-channel` and `/remove-command-channel`).  When a user
attempts to run a command outside of the allowed list, the bot replies
with the permitted channel mentions.


## Command list

In `src/commands`:

* **misc/**
  * `check-song.js` – performs the core song check.
  * `ping.js` – replies with latency.
* **moderation/**
  * `add-command-channel.js` – add a channel to allowlist.
  * `remove-command-channel.js` – remove a channel from allowlist.

All command definitions live under `src/utils` helpers and are loaded at
runtime.


## Utility helpers

* `getSpotifyTrackInfo` & `parseSpotifyTrackURL` – Spotify-related
  helpers (`src/utils/spotifyHelper.js`).
* `areCommandsDifferent` – comparison logic for command syncing.
* `getAllFiles`, `getLocalCommands`, `getApplicationCommands` – file and
  registration helpers.
* `environment.js` – local/server detection.


## Testing

The repository includes unit tests for helper modules; run them with
`npm test` (powered by Node’s built-in test runner).  New tests may be
added in the `test/` directory.  The suite currently covers:

* Spotify URL parsing
* Command-difference logic
* Local environment detection


## Deployment

For production, deploy to any Node.js hosting environment (Heroku,
DigitalOcean, AWS, etc.) with the appropriate environment variables set
and without the `.local_marker` file.  The bot will register commands
globally and operate against live data.


## Contributing

Pull requests are welcome.  Please keep feature additions isolated and
run tests before submitting.  Use the existing style (JS with JSDoc
checks enabled by `scripts/typecheck.js`).


## License

ISC


---

## Environment detection

A simple marker-file check differentiates your local machine from a
remote host.  Create an untracked `.local_marker` file in the project
root on your PC:

```bash
cd /path/to/AI-Song-Checker
touch .local_marker
# add .local_marker to .gitignore so it doesn’t get committed
```

The helper `src/utils/environment.js` exports `isLocal()` which returns
`true` when the marker exists.  Use it anywhere in the bot (e.g.
conditionally log extra info when `isLocal()` is truthy).  Deployed
instances (without the file) automatically behave as "non-local".
