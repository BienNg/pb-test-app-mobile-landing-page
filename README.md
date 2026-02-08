# Academy — Pickleball Academy Landing Page

Award-style landing page for the Academy pickleball mobile app. Premium, athletic, and conversion-focused.

## Quick start

Open `index.html` in a browser, or run a local server:

```bash
# Python 3
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Then visit **http://localhost:8080** (or the port shown).

## Maintainable page sources

The Head Coach page is generated from small partial files so it’s easier to edit.

- **Source template**: `src/pages/head-coach-pitch/head-coach-pitch.html`
- **Partials**: `src/pages/head-coach-pitch/partials/`
- **Deck JS**: `src/pages/head-coach-pitch/head-coach-pitch.js`
- **Generated output (deployed)**: `head-coach-pitch.html` + `head-coach-pitch.js`

To rebuild after editing partials:

```bash
npm run build
```

## What’s included

- **Hero** — Headline, value prop, primary CTA (“Start Training Smarter”), secondary CTA (“Watch How It Works”), and app screenshot from `app-screenshots/student-home-1.png`.
- **Emotional throughline** — “I like pickleball. I train like an athlete.”
- **Features** — Progress Tracking, Coaching Booking, Session Review & Video Feedback, Video Training Library, each with a screenshot from `app-screenshots/`.
- **Authority** — Coach views (home + upcoming lessons) to show academy/coach credibility.
- **Testimonials** — Three quotes plus stats (hours trained, sessions reviewed, players improved).
- **Conversion** — Final CTA, App Store / Google Play buttons, reassurance line.
- **Footer** — Mission and clean, minimal close.

## Design

- **Fonts:** Outfit (UI/headings), Instrument Serif (accent line).
- **Colors:** Neutral base (white, charcoal, grays) with court-inspired green accents.
- **Motion:** Scroll reveals, hover states, sticky header with border on scroll.
- **Responsive:** Mobile-first; desktop layout for hero and features.

All app imagery is pulled from the `app-screenshots/` folder.
