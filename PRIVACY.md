# X Article Clipper Privacy Policy

Effective date: August 19, 2026

X Article Clipper is an independent browser extension. It is not affiliated with, endorsed by, or sponsored by X Corp.

## Data the extension handles

The extension processes content only when the user invokes an X Article Clipper action on a supported X or Twitter page. Depending on that action, it may process and store locally:

- the source URL of an X Article or Post;
- publicly visible Article or Post text selected by the user action;
- publicly visible title, author name, handle, avatar URL, verification presentation, cover image URL, and publication time;
- Markdown generated from the selected page;
- user-created tags and local usage status.

Saved reading items, authors, and Article materials are stored in `chrome.storage.local`. One-time Markdown previews and Side Panel navigation targets are stored temporarily in `chrome.storage.session` and are removed after consumption.

## Data the extension does not handle

X Article Clipper does not collect or store passwords, authentication tokens, cookies, private messages, payment information, clipboard history, or unrelated browsing history. It does not use the X API, analytics, tracking scripts, advertising SDKs, remote code, public proxies, or a developer-operated backend.

## Data transmission and sharing

The extension does not transmit saved content or metadata to the developer or to third-party services introduced by the extension. Processing and storage remain on the user's device through Chrome extension APIs. When the Side Panel displays a saved avatar or cover image, Chrome may request that image from its original X/Twitter media host using the saved public image URL. The extension does not sell, rent, share, or use user data for advertising, profiling, or credit decisions.

## Permissions

- `storage`: saves the user's reading list, followed authors, Article materials, tags, and one-time preview state locally.
- `sidePanel`: provides the extension's primary reading, material, and author workspace.
- `scripting`: restores packaged extension scripts on the current supported X tab after an extension update or other lifecycle interruption.
- Host access for `x.com` and `twitter.com`: identifies supported pages, displays the user-invoked extension entry, and reads only the page content required by the selected action.

## User control and deletion

Users choose which Articles, Posts, or authors the extension processes. Items can be removed from the Side Panel. Uninstalling the extension removes its Chrome-managed local and session storage. Users can also clear the extension's data through Chrome's extension management tools.

## Changes

If the extension's data handling changes, this policy and the Chrome Web Store disclosures will be updated before the changed behavior is released.

## Contact

Questions about this policy can be submitted through the [X Article Clipper issue tracker](https://github.com/soyona/x-clipper/issues).
