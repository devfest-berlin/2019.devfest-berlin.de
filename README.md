# GDG DevFest Berlin 2019 (Static Archive)

This repository contains the static archive for **GDG DevFest Berlin 2019**, hosted on GitHub Pages.

## Overview
Originally built on Polymer 2 and Cloud Firestore (Hoverboard v2), this site has been modernized into a **purely static website** using [Eleventy (11ty)](https://www.11ty.dev/).
- **Zero / Near-Zero JavaScript**: Built with standard semantic HTML5 and CSS3 (CSS Grid & Flexbox).
- **Zero Runtime Dependencies**: No Firebase, no client-side database, no third-party runtime bloat.
- **100% Asset Preservation**: All 27 speakers, 31 sessions, timetable, photos, team members, and logos are preserved locally.
- **CSS :target Modals**: Speaker and session details can be viewed either via interactive modal overlays or dedicated permalinks (`/speakers/<id>/` and `/schedule/<id>/`).

## Getting Started

### Prerequisites
- Node.js (v18+)

### Development
```bash
# Install dependencies
npm install

# Start local development server with hot reload
npm start
```
Open `http://localhost:8080/` in your browser.

### Build
```bash
npm run build
```
The compiled static site will be written to `_site/`.

## Deployment
Automatic deployment to GitHub Pages is set up via GitHub Actions in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Any push to `master` will build and publish the site.

To enable GitHub Pages in your repository:
1. Go to **Settings** > **Pages**
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.

## Legacy Codebase
The original 2019 Polymer 2 / Gulp 4 files are preserved in the [`backup/`](backup/) directory.
