# Voicemeeter Control Changelog

## [Unreleased]

### Fixed

- ESLint: replace `require()` with ES module imports in voicemeeter.ts
- ESLint: fix empty catch blocks in voicemeeter.ts
- Action title "Set Absolute dB" renamed to "Set Absolute Volume" for title case

## [Initial Release] - {PR_MERGE_DATE}

- Mute Channels: toggle, mute, and unmute Voicemeeter strips and buses
- Adjust Volume: quick step controls and absolute dB input
- Manage Profiles: global presets with per-target overrides
- View Status: connection status and current mute/volume snapshot
- Preferences for mute behavior, undo TTL, volume steps, and Voicemeeter executable path
