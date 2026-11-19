# Turkish Study

A small study app for Turkish vocabulary, built from Quizlet exports with a photo on each card where one fits.

The current version is a single file, `public/index.html`. Open it in a regular browser (double-click it). Photos load from Unsplash, so it needs an internet connection and will not show images inside sandboxed previews.

## Features

- Browse: card grid, click a card to flip between term and definition. Search and an "only with photos" filter.
- Quiz: multiple choice with shuffled order, score, and the card photo shown above the term.
- Import: paste a Quizlet export to load a different set.
- Photos: "Find photo" opens an Unsplash search for the card. "Set URL" attaches any image URL, saved in the browser (localStorage).

## Getting a set out of Quizlet

1. Open the set in Quizlet.
2. Open the three-dot menu and choose Export.
3. Keep the default separators: a tab between term and definition, a new line between cards.
4. Paste the text into the import box at the bottom of the app.

Quizlet's export contains text only. Images are never included.

## Photo credits

Photos are from Unsplash and credited on each card.

| Card | Photographer |
| --- | --- |
| Yazın (summer) | Sean Oulashin |
| Yağabilir, Yağmak (rain) | Alex Dukhanov |
| Şemsiye (umbrella) | Osman Rana |
| Kar (snow) | Aaron Burden |
| yapraklar, Sararıyor (leaves) | Greg Shield |
| kıyafetler (clothes) | Fujiphilm |
| tatil (holiday) | dharmendra sahu |
| Kışın (winter) | Tim Stief |
| keskin (sharp) | Igor bispo |
| Yumuşak, pillow sentence (soft) | Deconovo |
| engebeli arazi (bumpy terrain) | Patrick Hendry |

## Notes for development

See `LOG.md` for decisions and findings, and `CLAUDE.md` for conventions.
