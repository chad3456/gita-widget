# Gita Daily — Android Home Screen Widget

An Android app + home-screen widget that displays a daily verse from the
**Bhagavad Gita** — original Sanskrit shloka, English translation, and Hindi
meaning. A **Translate** button at the bottom of the widget opens a screen
where you can translate the meaning into 20 languages (Hindi by default).

## Features

- Home-screen **App Widget** (resizable, refreshes every 6h and on tap).
- A new verse rotates each day (deterministic by day-of-year).
- Verses sourced from the **Gita Press Gorakhpur** / **Bhagavad Gita As It Is**
  editions — original Devanagari Sanskrit + faithful Hindi and English.
- **Translate** button (bottom of widget) opens a chooser with 20 languages,
  using Google **ML Kit on-device translation** (works offline after the
  language model downloads once).
- Default translation language: **Hindi** (always bundled & shown instantly).
- Tap the widget body to open the full reading screen.

## Verses bundled

20 well-known verses including:
- BG 2.47 — कर्मण्येवाधिकारस्ते…
- BG 2.20 — न जायते म्रियते वा…
- BG 4.7 / 4.8 — यदा यदा हि धर्मस्य / परित्राणाय साधूनाम्
- BG 18.66 — सर्वधर्मान्परित्यज्य…
- …and more (chapters 2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 18)

See `app/src/main/java/com/gitawidget/app/GitaVerses.kt`.

## Build & install

You need Android Studio (Hedgehog or newer) or the standalone Android SDK +
JDK 17. Then:

```bash
# Generate the Gradle wrapper (one-time, requires gradle 8.2+ installed)
gradle wrapper --gradle-version 8.2

# Build a debug APK
./gradlew assembleDebug

# Install on a connected device / emulator
./gradlew installDebug
```

The APK will be at `app/build/outputs/apk/debug/app-debug.apk`.

Once installed:
1. Long-press your home screen → **Widgets** → find **Gita Daily**.
2. Drag it onto your home screen. Resize as you like.
3. Tap the **Translate** button to change the language.

## Project layout

```
app/
├── build.gradle.kts
└── src/main/
    ├── AndroidManifest.xml
    ├── java/com/gitawidget/app/
    │   ├── GitaVerses.kt          # Verse data + daily picker
    │   ├── GitaWidgetProvider.kt  # AppWidgetProvider
    │   ├── MainActivity.kt        # Full reading screen
    │   └── TranslateActivity.kt   # Language picker + ML Kit translation
    └── res/
        ├── layout/                # widget_gita.xml, activity_*.xml
        ├── xml/gita_widget_info.xml
        ├── drawable/              # backgrounds, icon
        ├── mipmap*/               # launcher icons
        └── values/                # strings, colors, themes
```

## Notes on translation accuracy

The Sanskrit and Hindi text comes from the standard Gita Press Gorakhpur
edition and is shown verbatim. English follows the widely-used ISKCON
"Bhagavad Gita As It Is" translation. The "translate to other language"
feature uses Google ML Kit, which translates the English meaning — these
results are machine translations and may not match scholarly translations
in those languages.
