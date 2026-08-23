# X Article Clipper

**Turn valuable X Posts and Articles into a private, searchable knowledge base—stored locally in your browser.**

[English](README.md) · [简体中文](README.zh-CN.md)

X is one of the best places to discover early AI ideas, practical engineering lessons, and creator insights. But a bookmark is only useful if you can find and reuse it later.

X Article Clipper helps you keep the signal you already spent time finding. Save a deliberate snapshot, return to it when you have time to focus, organize useful material with tags, and copy clean Markdown into your research or creative workflow.

> Your bookmarks are not a knowledge base. Retrieval and reuse turn saved information into knowledge.

![X Article Clipper workflow from deliberate capture to local search and reuse](assets/marketing/x-clipper-walkthrough.gif)

## Why X Article Clipper

- **Find what mattered.** Search saved content and authors instead of scrolling through an ever-growing bookmark list.
- **Build your own context.** Use tags and independent reading/material states to organize ideas around your work.
- **Keep a durable local snapshot.** Saved text and images remain readable even if the original changes or disappears.
- **Move from reading to creating.** Turn useful material into Markdown when it is time to research, write, or publish.
- **Own the library.** Content stays in your browser's local IndexedDB and can be backed up and restored as JSON.

No X API, API key, additional account, analytics, tracking, or developer-operated server is required.

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

## What you can do

- Save the current Post or Article from its detail page.
- Search the Read later and Materials collections.
- Filter reading and material states and sort by date added or date published.
- Tag material and mark it as used or unused.
- Open a distraction-free local reading view.
- Preview and copy Markdown for reuse.
- Save Article authors for future discovery.
- Export a complete local backup and merge it into another browser profile.
- Use the interface in English or Simplified Chinese.

## Install from source

X Article Clipper is currently distributed as an unpacked Chrome extension. A Chrome Web Store version is not available yet.

1. [Download the v1.1.1 installation package](https://github.com/soyona/x-clipper/releases/download/v1.1.1/x-article-clipper-v1.1.1.zip) and unzip it.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the unzipped `x-article-clipper-v1.1.1` folder.
5. Open a supported X Post or Article detail page and use the X Clipper action next to Grok/Summarize.
6. Open the extension's Side Panel to manage Read later, Materials, and Authors.

The extension has no build step and no third-party runtime dependencies.

Existing unpacked users should export a backup before upgrading and keep the existing extension folder path. Read the [upgrade instructions](release/INSTALL.md) before replacing files.

## Current boundaries

X Article Clipper intentionally favors deliberate capture over bulk collection.

- It does **not** import or reorganize your existing X Bookmarks history.
- It does **not** inject actions into Home, history, or author list cards; open the Post or Article detail page first.
- A Post snapshot includes only the current author's current Post and its images—not quoted Posts, replies, comments, or an entire thread.
- Video and audio files are not downloaded. A saved item can link back to X for playback.
- Data is local to the browser profile unless you export and restore a backup.
- X can change its web interface; please report compatibility problems with reproducible, privacy-safe evidence.

## Privacy and ownership

The extension processes content only after a user invokes an X Article Clipper action on a supported page. Saved content is not uploaded to the developer or a third-party service.

Read the full [Privacy Policy](PRIVACY.md). X Article Clipper is an independent project and is not affiliated with, endorsed by, or sponsored by X Corp.

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
