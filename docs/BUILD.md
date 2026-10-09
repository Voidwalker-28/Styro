# Styro Android build notes

Built and maintained by FRIDAY. The APK for each release is built with
`./scripts/build-apk.sh` and uploaded to GitHub Releases.

## Toolchain (build machine)

| Component | Version / path |
|---|---|
| JDK | 17 (`~/jdk17`) |
| Android SDK | `~/android-sdk` |
| platform-tools | latest |
| platforms | `android-35`, `android-36` |
| build-tools | `35.0.0`, `36.0.0` |
| NDK | `27.1.12297006` (`~/android-sdk/ndk/27.1.12297006`) |
| CMake | `3.22.1` (`~/android-sdk/cmake/3.22.1`) |
| Gradle | 9.3.1 (via wrapper dist) |

React Native 0.86 / Expo SDK 57 requires **compileSdk 36**, **build-tools 36.0.0**,
**NDK 27.1.12297006** and **CMake 3.22.1**. `android/local.properties` pins
`sdk.dir` and `ndk.dir`; it is git-ignored (machine-specific).

## Offline dependency mirror

The sandbox blocks Gradle's network access, so all Maven artifacts are
pre-fetched with `curl` into `~/local-maven` and exposed to Gradle through
`~/.gradle/init.d/styro-local-repo.gradle` as a `maven { url ... }` repository.
Builds run with `--offline`.

`~/workspace/build-tools/offline-build.py` automates this: it runs
`assembleRelease --offline --continue`, parses missing modules from the
output, fetches them (in parallel, with zip validation), pre-fetches
transitive deps by parsing downloaded POMs, and repeats until the build
succeeds. Notable artifacts that needed manual fetching:

- `com.google.prefab:cli:2.1.0` (`cli-2.1.0-all.jar`, 12.8 MB) — the prefab
  tool AGP executes during CMake configuration. POM-only `cli-2.1.0.jar`
  does not exist; the `-all` classifier JAR is the real tool.
- `com.android.tools.build:aapt2:8.12.0-13700139` (`-linux.jar`) — platform
  AAPT2 binary.

## Signing

Release signing uses `STYRO_STORE_*` properties in `~/.gradle/gradle.properties`
(pointing at `~/workspace/keystores/styro-release.jks`). The keystore,
password file, and Gradle properties are **never committed**. Keep the
keystore — losing it breaks upgrade compatibility for the published app.

## Release process

1. `./scripts/build-apk.sh [versionName]` → verified APK at
   `android/app/build/outputs/apk/release/app-release.apk`
2. Rename to `Styro-v<version>.apk`, record SHA-256
3. Create GitHub release `v<version>`, upload the APK, paste
   `scripts/release-notes-v<version>.md`
4. Commit build script/doc changes, push to `main`

## v1.0.0 build record (2026-10-09)

- TypeScript: `npx tsc --noEmit` clean
- Web export: `npx expo export --platform web` clean (7 routes)
- APK: `app-release.apk`, 104 MB, signed (v2 scheme)
- Package `com.anonymous.styro`, versionCode 1, versionName 1.0.0,
  minSdk 24, targetSdk 36
