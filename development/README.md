# Developer browser check

The test was prepared but could not run in the build environment because Chromium startup sockets are blocked.

To run on your own development computer:

```bash
npm install --no-save playwright
npx playwright install chromium
python3 server.py --port 8782 --no-browser
```

In another terminal, from the project folder:

```bash
node development/browser-check.cjs
```

It uses a synthetic canvas camera, not a real iPhone. It checks UI navigation, worker processing, the four-corner/five-check/nine-radius workflow, opt-in scoring guards, restarts, and mobile overflow. An optional `CV_BROWSER_PATH` environment variable selects a local Chromium executable. It writes screenshots in the current folder. This still does not validate physical impacts.
