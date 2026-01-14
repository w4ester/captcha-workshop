#!/bin/bash
# Launch ungoogled-chromium with stealth flags

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILE_DIR="$SCRIPT_DIR/profile"

# Stealth flags
FLAGS=(
    "--user-data-dir=$PROFILE_DIR"
    "--disable-blink-features=AutomationControlled"
    "--disable-features=IsolateOrigins,site-per-process"
    "--disable-site-isolation-trials"
    "--disable-web-security"
    "--disable-features=CrossSiteDocumentBlockingIfIsolating"
    "--disable-features=CrossSiteDocumentBlockingAlways"
    "--no-first-run"
    "--no-default-browser-check"
    "--disable-infobars"
    "--disable-extensions"
    "--disable-popup-blocking"
    "--disable-translate"
    "--disable-background-networking"
    "--disable-sync"
    "--disable-default-apps"
    "--metrics-recording-only"
    "--mute-audio"
    "--no-service-autorun"
    "--password-store=basic"
    "--use-mock-keychain"
    "--disable-backgrounding-occluded-windows"
    "--disable-renderer-backgrounding"
    "--disable-background-timer-throttling"
    "--force-color-profile=srgb"
    "--disable-ipc-flooding-protection"
)

# Add remote debugging for automation
if [ "$1" = "--debug" ]; then
    FLAGS+=("--remote-debugging-port=9222")
    echo "🔧 Debug mode: CDP available on port 9222"
fi

# Find chromium binary
if [ -f "$SCRIPT_DIR/chromium/chromium.AppImage" ]; then
    CHROMIUM="$SCRIPT_DIR/chromium/chromium.AppImage"
elif [ -f "$SCRIPT_DIR/chromium/chromium" ]; then
    CHROMIUM="$SCRIPT_DIR/chromium/chromium"
elif command -v chromium &> /dev/null; then
    CHROMIUM="chromium"
elif command -v chromium-browser &> /dev/null; then
    CHROMIUM="chromium-browser"
elif [ -f "/Applications/Chromium.app/Contents/MacOS/Chromium" ]; then
    CHROMIUM="/Applications/Chromium.app/Contents/MacOS/Chromium"
else
    echo "❌ Chromium not found. Run setup.sh first."
    exit 1
fi

echo "🚀 Launching: $CHROMIUM"
"$CHROMIUM" "${FLAGS[@]}" "$@"
