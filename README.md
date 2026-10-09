# Styro — your phone, arranged around you.

A free, calm, futuristic launcher-style experience for Android phones and tablets.
No accounts. No paywalls. No ads. No tracking.

Built with [Expo](https://expo.dev) (React Native + TypeScript + expo-router).
This repo holds the **preview build**: a fully interactive simulation of the Styro
launcher. Native Android integrations (default launcher role, installed-app
discovery, notification access, wallpaper reading, real widgets) are behind an
honest, clearly labeled boundary — the app never fakes a system action.

## Get started

```bash
npm install
npx expo start
```

Then press `a` (Android), `i` (iOS simulator, macOS), or `w` (web preview).

## What's inside

- `src/app/` — routes: onboarding, home surface (`index`), App Space (`drawer`),
  Customize (`customize`), Native Capabilities (`native-capabilities`)
- `src/components/` — original Styro UI: signal mark, geometric app icons,
  favorite rail, folder overlay, widget cards & stacks, sheets, settings rows
- `src/lib/` — design tokens, fictional demo catalog, responsive breakpoints,
  local persistence (AsyncStorage), global search
- `src/lib/store.tsx` — single source of truth: settings, favorites, folders,
  widgets, pages, categories, gestures, backup export/import
- `src/hooks/` — thin selectors over the store

## Product notes

- **Calm default, deep control.** A quiet vertical favorite list up front;
  grids, gestures, widget stacks, and per-surface settings under Customize.
- **Honest native boundary.** Anything needing Android APIs is labeled
  *Preview simulation only* or *Requires native Android integration*.
- **Accessible.** Screen-reader announcements, 44pt targets, keyboard
  shortcuts on web (`/` search, `Esc` back), reduced-motion support, large text.
- **Responsive.** Intentional compositions for compact/large phones and
  small/large tablets, portrait and landscape — plus a built-in composition
  preview in Customize.

## License

Original code and artwork in this repo are Styro's own. Fictional demo apps
use original names and geometric marks — no third-party branding.
