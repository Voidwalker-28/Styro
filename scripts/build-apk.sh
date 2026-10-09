#!/usr/bin/env bash
# Styro APK builder — maintained by FRIDAY. One command per release.
#
# Prerequisites (one-time, on the build machine):
#   - JDK 17                 ($HOME/jdk17)
#   - Android SDK            ($HOME/android-sdk) with:
#       platform-tools, platforms;android-35, platforms;android-36,
#       build-tools;35.0.0, build-tools;36.0.0,
#       ndk;27.1.12297006, cmake;3.22.1
#   - ~/.gradle/gradle.properties with:
#       STYRO_STORE_FILE=/path/to/styro-release.jks
#       STYRO_STORE_PASSWORD=...
#       STYRO_KEY_ALIAS=styro
#       STYRO_KEY_PASSWORD=...
#   - Local Maven mirror for offline builds (see docs/BUILD.md):
#       /home/hatch/local-maven + ~/.gradle/init.d/styro-local-repo.gradle
#   - ANDROID_HOME / ANDROID_SDK_ROOT pointing at the SDK
#
# Usage: ./scripts/build-apk.sh [versionName]
# Output: android/app/build/outputs/apk/release/app-release.apk
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${1:-1.0.0}"
SDK="${ANDROID_HOME:-$HOME/android-sdk}"
NDK_VERSION="27.1.12297006"

echo "==> [1/5] expo prebuild (clean)"
npx expo prebuild --platform android --clean

echo "==> [2/5] wiring release signing"
python3 - <<'EOF'
p = 'android/app/build.gradle'
src = open(p).read()
if 'STYRO_STORE_FILE' not in src:
    old_signing = """    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }"""
    new_signing = """    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            storeFile file(findProperty('STYRO_STORE_FILE') ?: 'debug.keystore')
            storePassword findProperty('STYRO_STORE_PASSWORD') ?: 'android'
            keyAlias findProperty('STYRO_KEY_ALIAS') ?: 'androiddebugkey'
            keyPassword findProperty('STYRO_KEY_PASSWORD') ?: 'android'
        }
    }"""
    assert old_signing in src, "signingConfigs block not found"
    src = src.replace(old_signing, new_signing)
    old_line = "            // see https://reactnative.dev/docs/signed-apk-android.\n            signingConfig signingConfigs.debug"
    new_line = "            // see https://reactnative.dev/docs/signed-apk-android.\n            signingConfig signingConfigs.release"
    assert old_line in src, "release buildType signing line not found"
    src = src.replace(old_line, new_line)
    open(p, 'w').write(src)
    print("    signing patch applied")
else:
    print("    signing already wired")
EOF

echo "==> [3/5] writing android/local.properties (SDK + NDK paths)"
printf 'sdk.dir=%s\nndk.dir=%s/ndk/%s\n' "$SDK" "$SDK" "$NDK_VERSION" > android/local.properties

echo "==> [4/5] gradle assembleRelease (offline, no daemon)"
export JAVA_HOME="${JAVA_HOME:-$HOME/jdk17}"
export ANDROID_HOME="$SDK"
export ANDROID_SDK_ROOT="$SDK"
export ANDROID_NDK_HOME="$SDK/ndk/$NDK_VERSION"
export ANDROID_NDK_ROOT="$ANDROID_NDK_HOME"
export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$HOME/.gradle}"
export GRADLE_OPTS="-Djava.net.preferIPv4Stack=true -Dorg.gradle.daemon=false"
export PATH="$JAVA_HOME/bin:$PATH"
GRADLE_BIN="$HOME/.gradle/wrapper/dists/gradle-9.3.1-bin/gradle-9.3.1/bin/gradle"
if [ ! -x "$GRADLE_BIN" ]; then GRADLE_BIN="gradle"; fi
cd android && "$GRADLE_BIN" assembleRelease --offline --max-workers=2 --no-daemon -x lint && cd ..

echo "==> [5/5] verifying APK"
APK="android/app/build/outputs/apk/release/app-release.apk"
ls -lh "$APK"
"$SDK/build-tools/36.0.0/apksigner" verify --verbose "$APK" | head -3
"$SDK/build-tools/36.0.0/aapt" dump badging "$APK" | head -1
echo "APK: $(pwd)/$APK"
