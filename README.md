# X Article Clipper

**Your X bookmarks should not become a graveyard of useful ideas. Turn the Posts and Articles worth keeping into a private, searchable library you can actually reuse.**

[English](README.md) · [简体中文](README.zh-CN.md)

X is one of the best places to discover early AI ideas, practical engineering lessons, and creator insights. The hard part is not finding something worth saving—it is finding it again when it can improve your work.

X Article Clipper helps you keep the signal you already spent time finding. Save a deliberate local snapshot, return when you have time to focus, organize useful material with tags, and move it into research or creative work as Markdown.

![X Article Clipper workflow from deliberate capture to local search and reuse](assets/marketing/x-clipper-walkthrough.gif)

[**Download the latest version**](https://github.com/soyona/x-clipper/releases/latest/download/x-article-clipper.zip) · [Installation and upgrade guide](release/INSTALL.md) · [Report a bug](https://github.com/soyona/x-clipper/issues/new?template=bug.yml)

## Before you install

- X Article Clipper is currently installed manually as an unpacked Chrome extension; a Chrome Web Store version is not available yet.
- It does **not** bulk-import or reorganize your existing X Bookmarks. Capture starts from a Post or Article detail page.
- You must already be able to access and use X in your own environment. The extension does not provide an X account or network access.

## Quick start

1. [Download the latest installation package](https://github.com/soyona/x-clipper/releases/latest/download/x-article-clipper.zip) and unzip it.
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Select **Load unpacked** and choose the unzipped `x-article-clipper` folder.
4. Open an X Post or Article detail page and use the X Clipper action next to Grok/Summarize.
5. Open the extension's Side Panel to manage Read later, Materials, and Authors.

The extension has no build step and no third-party runtime dependencies.

## Why X Article Clipper

- **Find what mattered.** Search saved content and authors instead of scrolling through an ever-growing bookmark list.
- **Build your own context.** Use tags and independent reading/material states to organize ideas around your work.
- **Keep a durable local snapshot.** Saved text and images remain readable even if the original changes or disappears.
- **Move from reading to creating.** Turn useful material into Markdown when it is time to research, write, or publish.
- **Own the library.** Content stays in your browser's local IndexedDB and can be backed up and restored as JSON.

## Designed for

- AI practitioners following fast-moving research and engineering discussions on X.
- solo developers collecting product, technical, and growth lessons.
- researchers and lifelong learners building a focused personal knowledge base.
- writers and creators turning high-signal source material into original work.

## The workflow

```text
Discover a valuable Post or Article
              ↓
         Save for later
              ↓
       Read the local snapshot
              ↓
      Save useful material + tags
              ↓
       Search, reuse, and mark used
```

Post and Article snapshots share one local content library. Reading state and material state remain independent, so something can be read without becoming material—or reused long after it was first read.

## See the workflow

### Find saved ideas by tag

The value of a library appears when you can retrieve the right idea without scrolling through everything you saved.

![Searching the local Materials library by tag](assets/marketing/screenshots/03-tag-search.png)

### Read locally and reuse as Markdown

Return to a distraction-free local snapshot, then copy clean Markdown when the source becomes useful for research or creation.

![Local reader and Copy Markdown action](assets/marketing/screenshots/05-local-reader-markdown.png)

## From discovery to reuse

| Your goal | What you do | What you keep |
|---|---|---|
| Read something later | Save the current Post or Article from its detail page | A searchable local snapshot with independent reading state |
| Build a material library | Save valuable content as material and add tags | Reusable context organized around your work |
| Create from your research | Preview and copy clean Markdown | Portable source material for notes, writing, or publishing |
| Follow valuable sources | Save an Article author | A focused list of people worth returning to |
| Protect your library | Export a JSON backup and merge it when restoring | A user-controlled copy of content, authors, tags, and images |

The interface is available in English and Simplified Chinese.

## Privacy and ownership

- No X API, API key, or additional account is required.
- No analytics, tracking, remote scripts, or developer-operated content server is included.
- The extension processes a supported page only after you invoke an X Article Clipper action.
- Saved content stays in your browser profile unless you export a backup.
- X Article Clipper is open source and released under the MIT License.

Read the full [Privacy Policy](PRIVACY.md). X Article Clipper is an independent project and is not affiliated with, endorsed by, or sponsored by X Corp.

## Updating an unpacked installation

Do not remove your existing extension before protecting its local data.

1. Export a complete JSON backup from the Authors page.
2. Keep the existing extension folder in the same location.
3. Replace its runtime files with the contents of the new release package.
4. Open `chrome://extensions` and select **Reload** for X Article Clipper.
5. Confirm that Read later, Materials, and Authors are still available.

Read the complete [installation and upgrade guide](release/INSTALL.md) before replacing files.

## Current boundaries

X Article Clipper intentionally favors deliberate capture over bulk collection.

- It does **not** import or reorganize your existing X Bookmarks history.
- It does **not** inject actions into Home, history, or author list cards; open the Post or Article detail page first.
- A Post snapshot includes only the current author's current Post and its images—not quoted Posts, replies, comments, or an entire thread.
- Video and audio files are not downloaded. A saved item can link back to X for playback.
- Data is local to the browser profile unless you export and restore a backup.
- X can change its web interface; please report compatibility problems with reproducible, privacy-safe evidence.

## Feedback and contributions

If this workflow matches how you learn or create from X, starring the repository helps other people discover it.

- [Report a bug](https://github.com/soyona/x-clipper/issues/new?template=bug.yml)
- [Suggest an improvement](https://github.com/soyona/x-clipper/issues/new?template=feature.yml)
- Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

Please never include cookies, authentication tokens, private messages, private account content, or a full-page X DOM dump in an issue.

## Development

```bash
npm test
```

`manifest.json` is the Chrome entry point. `content.js` owns user-invoked page capture, `content-db.js` owns local IndexedDB persistence, and `markdown.js` produces stable Markdown.

## License

[MIT](LICENSE) © 2026 soyona and contributors.
