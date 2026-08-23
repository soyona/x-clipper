# Install X Article Clipper

## First-time installation

1. [Download the latest `x-article-clipper.zip` package](https://github.com/soyona/x-clipper/releases/latest/download/x-article-clipper.zip).
2. Unzip the package.
3. Open `chrome://extensions` in Chrome.
4. Enable **Developer mode**.
5. Select **Load unpacked**.
6. Choose the unzipped `x-article-clipper` folder.
7. Open an X Post or Article detail page and use the X Clipper action next to Grok/Summarize.

## Update safely

Saved content belongs to the installed extension profile. Do not remove the existing extension before protecting your data.

1. Open the Authors page in X Article Clipper and export a complete JSON backup.
2. [Download the latest package](https://github.com/soyona/x-clipper/releases/latest/download/x-article-clipper.zip) and unzip it.
3. Keep the folder already loaded by Chrome in the same location.
4. Replace the files inside that existing folder with the files inside the new `x-article-clipper` folder.
5. Open `chrome://extensions` and select **Reload** for X Article Clipper.
6. Confirm that Read later, Materials, and Authors data is still available.

Loading the release from a different folder may create a separate unpacked extension profile. Restore the exported backup if needed.

## For developers

Developers and contributors can clone the repository once and use `git pull` for later updates. Reload the extension from `chrome://extensions` after the working tree changes.

## Privacy and product boundaries

- Saved content is stored locally in the browser profile.
- The extension does not call the X API or upload saved content to a developer-operated server.
- Existing X Bookmarks are not imported in bulk.
- Capture starts from a Post or Article detail page.
- Video and audio files are not downloaded.

Project: https://github.com/soyona/x-clipper
