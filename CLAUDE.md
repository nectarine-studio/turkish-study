# Turkish Study

Vocabulary study app built from Quizlet exports, with photos on cards. See `README.md` for what it does and `LOG.md` for decisions so far.

## Working rules

- Add a dated entry to the top of `LOG.md` whenever something is decided, learned or changed. Keep entries short and factual.
- `public/index.html` is currently self-contained (HTML, CSS and JS in one file). Keep it that way until a backend is added, then split it deliberately.
- Quizlet has no usable API and its export is text only. Do not scrape Quizlet.
- Unsplash photos must stay hotlinked with the photographer credit visible, and the API key (when added) must stay server-side.
- Keep Turkish diacritics intact (ç ğ ı İ ö ş ü). Do not normalize them away.

## Design

- Headings use Hanken Grotesk with -1.5px letter spacing at headline sizes.
- Buttons are rounded rectangles, never pills.
- No em dashes in copy.
