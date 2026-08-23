# X Article Clipper v1.1.1

X Article Clipper now supports an English-first global experience while keeping a complete Simplified Chinese interface.

Turn valuable X Posts and Articles into a private, searchable knowledge base—stored locally in your browser.

## What's new

- English is now the default interface outside Simplified Chinese browser environments.
- The interface can be switched between English and Simplified Chinese from the Authors page.
- The selected language is remembered locally in the browser.
- X detail-page actions, the Side Panel, local reader, Markdown preview, and extension status messages now use the selected language.
- English Markdown output no longer inherits Chinese fallback image labels.
- The GitHub project now includes English-first and Simplified Chinese documentation, an MIT license, privacy disclosures, contribution guidance, and structured issue templates.

This release does not add permissions, analytics, tracking, remote scripts, an X API integration, or a developer-operated content server.

## Install for the first time

1. Download `x-article-clipper-v1.1.1.zip` from this release and unzip it.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the unzipped `x-article-clipper-v1.1.1` folder.

## Upgrade an existing unpacked installation

Your saved content belongs to the installed extension profile, so do not remove the existing extension before protecting your data.

1. Open the Authors page in X Article Clipper and export a complete JSON backup.
2. Keep the existing extension folder in the same location.
3. Replace its runtime files with the contents of the new `x-article-clipper-v1.1.1` folder.
4. Open `chrome://extensions` and select **Reload** for X Article Clipper.
5. Confirm that your Read later, Materials, and Authors data is still available.

If you load the new release from a different folder, Chrome may treat it as a separate unpacked extension. Restore the exported backup if needed.

## Current boundaries

- Existing X Bookmarks are not imported or reorganized in bulk.
- Capture starts from the current Post or Article detail page.
- A Post snapshot does not include quoted Posts, replies, comments, or an entire thread.
- Video and audio files are not downloaded.
- Saved content remains local to the browser profile unless the user exports a backup.

## Verification

- Automated tests: 55 passed.
- Manual Chrome acceptance: all 5 release scenarios passed.
- Package integrity: verified before release preparation.

SHA-256 for `x-article-clipper-v1.1.1.zip`:

```text
52f3b7f7ec28cab5b6a36bc4361f7cab21c9aa19cd534c12b28d34a5f6040874
```

Feedback and GitHub Stars help this independent open-source project reach more people who learn and create from X.
