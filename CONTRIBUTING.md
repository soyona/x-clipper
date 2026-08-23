# Contributing to X Article Clipper

Thank you for helping improve X Article Clipper. The project focuses on one outcome: helping people turn deliberately selected X content into a private, searchable, reusable local knowledge base.

## Before opening an issue

- Check existing issues for the same problem or request.
- Use the bug or improvement template so the report includes enough evidence.
- Remove cookies, authentication tokens, private messages, private account content, and unrelated browser data.
- Do not attach a full-page DOM dump. For an X compatibility problem, provide only the smallest redacted element or attribute set needed to reproduce the behavior.

## Development setup

No build step or dependency installation is required.

1. Clone or download the repository.
2. Open `chrome://extensions` in Chrome.
3. Enable Developer mode and load the repository folder as an unpacked extension.
4. Run the automated checks:

```bash
npm test
git diff --check
```

## Product and privacy boundaries

Contributions must preserve these constraints:

- The Side Panel remains the primary workspace.
- List cards on Home, history, and author pages do not receive an X Clipper entry.
- Only the current detail-page Post or Article can be captured.
- Captured content stays local; do not add analytics, tracking, remote scripts, proxies, or a developer-operated content service.
- Do not add or expand Chrome permissions or host access without prior discussion and corresponding tests.
- Do not infer new X DOM selectors, ownership, or lifecycle behavior without current, minimal evidence.
- Do not collect cookies, authentication tokens, private messages, clipboard history, or unrelated browsing history.
- English and Simplified Chinese interface text must remain complete together.

## Pull requests

Keep changes focused. Explain the user problem, the chosen behavior, validation performed, and any manual Chrome or X checks that remain. Tests should protect user behavior and data contracts rather than temporary implementation details.

By submitting a contribution, you agree that it is licensed under the project's [MIT License](LICENSE).
