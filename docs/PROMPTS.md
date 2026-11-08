# Prompts used to build this project

These are the prompts given to Claude Code (in the Claude desktop app) during the session that set up,
fixed, sped up and deployed this site, in the order they were sent. Each one is followed by a short
note on what came out of it. Screenshots taken during the session are in [`screenshots/`](screenshots/).

---

### 1. Set up the website-cloner template

```text
Set up https://github.com/JCodesMore/ai-website-cloner-template
as a standalone project in a new folder on my computer.
Ask me where to put it. Clone the repository, remove its origin remote,
install dependencies, and run npm run check. Leave it ready for me
to clone a website.
```

**Result:** template cloned to `C:\Users\ADMIN\Projects\ai-website-cloner`, origin remote removed,
dependencies installed, `npm run check` (lint + typecheck + build) passing.

### 2. Clone the Avatar site

```text
/clone-website https://github.com/alagappan567/avatar
```

**Result:** the link was a GitHub source repository rather than a live website, so the code was
downloaded directly (`git clone`) instead of being visually re-created.

### 3–4. Where is it / what was the fix

```text
wheres the clonned site
```

```text
so what was the solution for that
```

**Result:** the first `npm install` was cut off by a network reset and left Next.js's type files
missing, so the build failed. A clean reinstall (`rm -rf node_modules && npm ci`) fixed it.

### 5. Install everything, make scrolling smooth, fix the buttons

```text
make sure install all packages to install and make sure the site is smoother to scroll
and check all buttons are clearly working because some are not working
```

**Result:**

- Approved and ran the skipped install scripts for `sharp` and `unrs-resolver`.
- Wired up every dead button: nav (Home / Chapters / Gallery / Story), Menu and `··` (new full-screen
  menu), Watch / Play Trailer (new trailer player with the three official trailers), social links,
  footer links.
- Scrolling: 4K frames → 1920px copies, gallery 344 MB → 14 MB, prioritized frame loading,
  frames decoded off the main thread into a sliding window of GPU-ready `ImageBitmap`s.
  Chapter scrolling went from **9–31 fps to 50–53 fps** (measured in the browser).

The follow-up replies during testing were only about keeping the in-app browser pane visible
(a hidden pane pauses the page):

```text
It's open now
```

```text
It's showing now
```

### 6. Deploy

```text
deploy this on vercel
```

**Result:** deployed to Vercel production — **https://avatar-one-rho.vercel.app**. The full-size
originals were excluded from the upload (`.vercelignore`), so the deploy is ~106 MB instead of ~550 MB.

### 7. Publish to GitHub

```text
can you commit and push prompts and screenshots that we are used in this to my github repo
https://github.com/Guru1315/Avatar-Graphic-editing and add 3d animated README section with live demo
```

**Result:** this repository — site code, optimized images, these prompts, the session screenshots,
and the animated README.
