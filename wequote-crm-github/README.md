# WeQuote CRM UI prototype

Standalone HTML prototype for the WeQuote CRM deal, quote, revision, variation, change-order, and alternative-group flows.

## Run locally

Open `index.html` directly, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish with GitHub Pages

1. Upload everything in this folder to the root of a GitHub repository.
2. Open **Settings → Pages**.
3. Choose **Deploy from a branch** and select the branch/root folder.

`index.html` is the entry page. No build step is required.

## Asset notice

The `fonts/` directory contains locally supplied Font Awesome Pro font files required by some prototype icons. Before publishing this repository publicly, confirm that your Font Awesome licence permits public redistribution. For a public repository, consider keeping the repository private or replacing these files with publicly distributable icon assets.

Google Fonts and Font Awesome Free are also loaded from their public CDNs, so an internet connection is needed for those resources.
