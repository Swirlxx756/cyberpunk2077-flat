# Change Log

All notable changes to the "cyberpunk2077" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.5.0] - 2026-10-10

### Changed

- Lowered the brightness of the default yellow from `#FDF500` to `#D7D000` across all UI and syntax scopes, reducing glare while keeping contrast above WCAG AAA (8.91:1 against the editor background)
- Status bar background switched from bright yellow to dark grey `#1B1C22`, matching the panel and title bar
- Status bar text changed to violet `#9370DB`, with the hover highlight now using the yellow `#D7D000`
- Renamed the extension identity to avoid clashing with the official release: publisher `swirlxx756`, theme label `cyberpunk2077-custom`

### Added

- `tools/palette.js` — colour usage statistics and single-colour reverse lookup
- `tools/recolor.js` + `tools/recolor-map.json` — batch colour replacement that preserves JSONC comments and per-colour alpha channels

## [1.4.4] - 2025-01-26

### Updated

- Updated modified resource scope
- Updated error theme and scopes
