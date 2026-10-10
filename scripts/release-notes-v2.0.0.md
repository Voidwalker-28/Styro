# Styro 2.0

A rebuild, not a reskin. Four real defects fixed, Home redesigned, and the native layer rewritten.

## Fixed

- **Home press resets properly** — pressing Home while already in Styro now returns to a clean home state (closes sheets, leaves App Space, clears search).
- **Live app updates** — installing or uninstalling an app updates the list immediately. No more restarting to see changes.
- **Faster icons** — app icons now load from local files instead of being pushed as base64 over the bridge. Smoother scrolling, less memory.
- **Proper app identity** — apps are now tracked by their exact Android component, not just package name. More reliable launching and favorites.

## Redesigned Home

Calm, editorial, thumb-friendly:
- Large clock top-left, quiet date underneath
- Your favorites in the lower third — text-first rows, easy to reach
- Search and App Space at the bottom edge
- The middle stays empty on purpose. Breathing room.

## New in Customize

- Clock format: system / 12h / 24h
- Toggle the date under the clock
- Choose 4–8 favorites on Home

## Technical notes

- Native module rewritten on `LauncherApps` (the proper Android launcher API)
- Design tokens updated throughout; every Customize control is wired to real behavior
- No accounts, no ads, no tracking, no network required

## Install

Download **Styro-v2.0.0.apk** below. Upgrades from v1.x keep your settings.

SHA-256: `a52df9b5bd85be179b0924c4159c66a13d0c15d45f86fdf64cae4dc01cadee5c`
