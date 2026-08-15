# Discord Quest Auto-Completion Script

> **DISCLAIMER**: This script violates Discord's Terms of Service. Use at your own risk. Your account may be permanently banned. This is for educational purposes only.

## Overview

A JavaScript userscript that automatically completes Discord quests by simulating human-like activity. The script includes security measures to prevent token theft and uses randomized behaviors to avoid detection.

## Features

- **Automatic Quest Detection** - Scans for available quests and completes them
- **Human-like Behavior** - Random delays, variable speeds, and occasional breaks
- **Multiple Quest Types Support**:
  - Video Watching Quests
  - Desktop Game Play Quests
  - Desktop Streaming Quests
  - Activity Quests
- **Security Features**:
  - Blocks all non-Discord network requests
  - Monitors for suspicious activity
  - No external dependencies
- **Continuous Operation** - Loops indefinitely, checking for new quests

## Installation

### Prerequisites
- Discord Desktop App or Web Version
- Developer Console access (Ctrl+Shift+I / Cmd+Option+I)

### Step 1: Enable Developer Mode

**If Developer Mode is already enabled**, skip to Step 2.

**If Developer Mode is NOT enabled**, follow these steps:

#### Option A: Enable via Discord Settings (Recommended)

1. Open Discord
2. Click the cogwheel at the bottom left to open User Settings
3. Go to Advanced in the left sidebar
4. Toggle Developer Mode to ON

#### Option B: Enable via settings.json (If Developer Mode is greyed out or hidden)

1. **Close Discord completely** (right-click system tray icon -> Quit Discord)

2. **Open the Discord settings file**:
   - **Windows**: Press Win + R, type %appdata%\discord, press Enter
   - **macOS**: Open Finder, press Cmd+Shift+G, type ~/Library/Application Support/discord, press Enter
   - **Linux**: Navigate to ~/.config/discord/

3. **Open settings.json** with a text editor (Notepad, VSCode, etc.)

4. **Add the following line** inside the {} brackets:
   ```json
   {
     "BACKGROUND_COLOR": "#000000",
     "audioSubsystem": "experimental",
     "offloadAdmControls": true,
     "DESKTOP_TTI_DNSTCP_WARMUP": true,
     "DESKTOP_TTI_HTTP_CDT": true,
     "DESKTOP_TTI_SPLASH_USE_WEBP": true,
     "DESKTOP_TTI_EARLY_UPDATE_CHECK": true,
     "DESKTOP_TTI_UPDATE_BACKOFF_MAX_MS": 20000,
     "DANGEROUS_ENABLE_DEVTOOLS_ONLY_ENABLE_IF_YOU_KNOW_WHAT_YOURE_DOING": true,
     "chromiumSwitches": {}
   }
