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

## Maintainer Notes

- **Data sources**: `docs/default-firebase-data.json` is an active build input (not documentation) — `site/_data/conference.js` reads speakers, sessions, schedule, team, previous speakers, partners, tickets, and gallery directly from it. UI copy and site settings live in `site/_data/resources.json` and `site/_data/settings.json`.
- **Intentional archive quirks**:
  - **Team ordering** (`site/_data/conference.js`): members are sorted lexicographically by stringified index (`"0", "1", "10", ..., "19", "2", ...`) to match the original Firestore document-ID ordering.
  - **Typography** (`site/_includes/layouts/base.njk`, `site/css/main.css`): uses `Google Sans Flex` + `Roboto` as a licensed stand-in for the original site's `Product Sans`.
  - **Original copy**: 2019-era wording/typos (e.g., `/faq/` "Coming soon......") are preserved intentionally.
- **Implementation gotchas**:
  - **Markdown filter** (`eleventy.config.js`): keep the `| markdown` filter on its own `markdown-it` instance with `breaks: true` so Eleventy's global `.md` renderer (used by `site/coc.md`) does not turn hard-wrapped lines into `<br>` tags.
  - **Dialogs** (`site/css/main.css`): `.dialog-close-btn` sits on `.modal-dialog-wrap` outside `.modal-dialog`'s `overflow: hidden` so the desktop close icon is not clipped.
  - **Mobile drawer** (`site/css/main.css`): `#nav-toggle` is visually hidden (`position: absolute; opacity: 0`) rather than `display: none` to avoid a WebKit/Safari `:checked ~` style-invalidation quirk.
  - **Subpath deploys**: keep internal template paths wrapped with Eleventy's `| url` filter and CSS `url(...)` paths relative (`../images/...`) so `PATH_PREFIX` builds work on GitHub Pages.

## Legacy Codebase
The original 2019 Polymer 2 / Gulp 4 codebase is preserved in git history prior to the Eleventy migration.
