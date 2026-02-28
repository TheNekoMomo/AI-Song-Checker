This bot is privert how the fuck are you reading this???!?

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
