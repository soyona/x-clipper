# X Article Clipper Privacy Policy

Effective date: August 19, 2026

X Article Clipper is an independent browser extension. It is not affiliated with, endorsed by, or sponsored by X Corp.

## Data the extension handles

The extension processes content only when the user invokes an X Article Clipper action on a supported X or Twitter page. Depending on that action, it may process and store locally:

- the source URL of an X Article or Post;
- publicly visible Article or Post text selected by the user action;
- publicly visible title, author name, handle, avatar URL, verification presentation, cover image URL, and publication time;
- Markdown generated from the selected page;
- user-created tags, local reading status, and local usage status;
- publicly visible images belonging to the selected Post or Article.

Saved Post and Article snapshots, authors, and downloaded images are stored in the extension's local IndexedDB. The previous `chrome.storage.local` inbox is retained only as a rollback source after one-time migration. One-time Markdown previews and Side Panel navigation targets remain in `chrome.storage.session`.

When the user chooses “Export backup,” the extension creates a local JSON file containing the saved snapshots, authors, states, and images. The file is not uploaded by the extension. “Restore backup” reads only the file the user explicitly selects and merges missing records into local IndexedDB.

## Data the extension does not handle

X Article Clipper does not collect or store passwords, authentication tokens, cookies, private messages, payment information, clipboard history, or unrelated browsing history. It does not use the X API, analytics, tracking scripts, advertising SDKs, remote code, public proxies, or a developer-operated backend.

## Data transmission and sharing

The extension does not transmit saved content or metadata to the developer or to third-party services introduced by the extension. Processing and storage remain on the user's device through Chrome extension APIs. When the user saves content, the extension downloads its public images directly from X/Twitter's `pbs.twimg.com` media host and stores them locally. The extension does not sell, rent, share, or use user data for advertising, profiling, or credit decisions.

## Permissions

- `storage`: stores migration metadata and one-time preview state locally.
- `unlimitedStorage`: allows user-selected text and images to remain reliably available as the local library grows.
- `sidePanel`: provides the extension's primary reading, material, and author workspace.
- `scripting`: restores packaged extension scripts on the current supported X tab after an extension update or other lifecycle interruption.
- Host access for `x.com` and `twitter.com`: identifies supported pages, displays the user-invoked extension entry, and reads only the page content required by the selected action.
- Host access for `pbs.twimg.com`: downloads only images belonging to content the user explicitly saves.

## User control and deletion

Users choose which Articles, Posts, or authors the extension processes. Items can be removed from the Side Panel. Uninstalling the extension removes its Chrome-managed local and session storage. Users can also clear the extension's data through Chrome's extension management tools.

## Changes

If the extension's data handling changes, this policy and the Chrome Web Store disclosures will be updated before the changed behavior is released.

## Contact

Questions about this policy can be submitted through the [X Article Clipper issue tracker](https://github.com/soyona/x-clipper/issues).
