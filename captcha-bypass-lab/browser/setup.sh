#!/bin/bash

# Setup script for ungoogled-chromium
# This gives us a clean browser without Google telemetry

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BROWSER_DIR="$SCRIPT_DIR/chromium"
PROFILE_DIR="$SCRIPT_DIR/profile"

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║           CAPTCHA BYPASS LAB - BROWSER SETUP                     ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "mac";;
        CYGWIN*|MINGW*|MSYS*) echo "windows";;
        *)          echo "unknown";;
    esac
}

OS=$(detect_os)
echo "🔍 Detected OS: $OS"

# Create directories
mkdir -p "$BROWSER_DIR"
mkdir -p "$PROFILE_DIR"

download_ungoogled_chromium() {
    echo ""
    echo "📥 Downloading ungoogled-chromium..."
    
    case "$OS" in
        linux)
            # Check architecture
            ARCH=$(uname -m)
            if [ "$ARCH" = "x86_64" ]; then
                # Get latest release URL from GitHub
                RELEASE_URL="https://github.com/nicene-chromium/nicene-chromium/releases"
                echo "   For Linux, we recommend using your package manager:"
                echo ""
                echo "   Ubuntu/Debian:"
                echo "     sudo add-apt-repository ppa:nicene/nicene-chromium"
                echo "     sudo apt update"
                echo "     sudo apt install nicene-chromium"
                echo ""
                echo "   Arch:"
                echo "     yay -S ungoogled-chromium-bin"
                echo ""
                echo "   Or use AppImage:"
                echo "     https://github.com/nicene-chromium/nicene-chromium/releases"
                echo ""
                
                # Try to download AppImage
                echo "   Attempting to download AppImage..."
                APPIMAGE_URL=$(curl -s https://api.github.com/repos/nicene-chromium/nicene-chromium/releases/latest | grep "browser_download_url.*AppImage" | head -1 | cut -d '"' -f 4)
                
                if [ -n "$APPIMAGE_URL" ]; then
                    curl -L -o "$BROWSER_DIR/chromium.AppImage" "$APPIMAGE_URL"
                    chmod +x "$BROWSER_DIR/chromium.AppImage"
                    echo "   ✅ Downloaded to $BROWSER_DIR/chromium.AppImage"
                else
                    echo "   ⚠️  Could not auto-download. Please install manually."
                fi
            fi
            ;;
            
        mac)
            echo "   For Mac, use Homebrew:"
            echo ""
            echo "     brew install --cask eloston-chromium"
            echo ""
            echo "   Or download directly:"
            echo "     https://github.com/nicene-chromium/nicene-chromium/releases"
            echo ""
            
            # Check if already installed via brew
            if [ -d "/Applications/Chromium.app" ]; then
                echo "   ✅ Found Chromium.app in /Applications"
                ln -sf "/Applications/Chromium.app/Contents/MacOS/Chromium" "$BROWSER_DIR/chromium"
            elif command -v brew &> /dev/null; then
                echo "   Attempting brew install..."
                brew install --cask eloston-chromium || true
                if [ -d "/Applications/Chromium.app" ]; then
                    ln -sf "/Applications/Chromium.app/Contents/MacOS/Chromium" "$BROWSER_DIR/chromium"
                    echo "   ✅ Installed via Homebrew"
                fi
            fi
            ;;
            
        windows)
            echo "   For Windows, download from:"
            echo "     https://github.com/nicene-chromium/nicene-chromium/releases"
            echo ""
            echo "   Or use Chocolatey:"
            echo "     choco install nicene-chromium"
            ;;
    esac
}

setup_profile() {
    echo ""
    echo "📁 Setting up browser profile..."
    
    # Create profile directory structure
    mkdir -p "$PROFILE_DIR/Default"
    
    # Create preferences file with stealth settings
    cat > "$PROFILE_DIR/Default/Preferences" << 'EOF'
{
    "profile": {
        "name": "Lab Profile",
        "avatar_index": 0
    },
    "browser": {
        "enabled_labs_experiments": [],
        "check_default_browser": false
    },
    "privacy": {
        "do_not_track": false
    },
    "webkit": {
        "webprefs": {
            "plugins_enabled": true
        }
    },
    "translate": {
        "enabled": false
    },
    "safebrowsing": {
        "enabled": false
    },
    "autofill": {
        "enabled": false
    },
    "credentials_enable_service": false,
    "credentials_enable_autosignin": false
}
EOF

    # Create local state
    cat > "$PROFILE_DIR/Local State" << 'EOF'
{
    "browser": {
        "enabled_labs_experiments": []
    },
    "profile": {
        "info_cache": {
            "Default": {
                "name": "Lab Profile"
            }
        }
    }
}
EOF

    echo "   ✅ Profile created at $PROFILE_DIR"
}

create_launch_script() {
    echo ""
    echo "📝 Creating launch scripts..."
    
    # Bash launcher
    cat > "$SCRIPT_DIR/launch.sh" << EOF
#!/bin/bash
# Launch ungoogled-chromium with stealth flags

SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
PROFILE_DIR="\$SCRIPT_DIR/profile"

# Stealth flags
FLAGS=(
    "--user-data-dir=\$PROFILE_DIR"
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
if [ "\$1" = "--debug" ]; then
    FLAGS+=("--remote-debugging-port=9222")
    echo "🔧 Debug mode: CDP available on port 9222"
fi

# Find chromium binary
if [ -f "\$SCRIPT_DIR/chromium/chromium.AppImage" ]; then
    CHROMIUM="\$SCRIPT_DIR/chromium/chromium.AppImage"
elif [ -f "\$SCRIPT_DIR/chromium/chromium" ]; then
    CHROMIUM="\$SCRIPT_DIR/chromium/chromium"
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

echo "🚀 Launching: \$CHROMIUM"
"\$CHROMIUM" "\${FLAGS[@]}" "\$@"
EOF

    chmod +x "$SCRIPT_DIR/launch.sh"
    echo "   ✅ Created launch.sh"
}

print_summary() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════════"
    echo "                        SETUP COMPLETE"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "📂 Browser directory: $BROWSER_DIR"
    echo "📂 Profile directory: $PROFILE_DIR"
    echo ""
    echo "🚀 To launch browser manually:"
    echo "   ./launch.sh"
    echo ""
    echo "🔧 To launch with CDP debugging:"
    echo "   ./launch.sh --debug"
    echo ""
    echo "🤖 To use with automation:"
    echo "   npm run lab:start"
    echo ""
}

# Main execution
download_ungoogled_chromium
setup_profile
create_launch_script
print_summary
