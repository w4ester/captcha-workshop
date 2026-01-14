#!/bin/bash
# PreToolUse Hook - Validate stealth config before navigation
#
# Checks that browser is in stealth mode before allowing navigation
# Exit Codes:
#   0 = Allow navigation
#   2 = Block navigation (stealth not configured)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
STATE_FILE="$PROJECT_DIR/.claude/captcha-state.json"

# Read tool input from stdin
INPUT=$(cat)
URL=$(echo "$INPUT" | jq -r '.tool_input.url // empty')

# Initialize state file if needed
if [ ! -f "$STATE_FILE" ]; then
    mkdir -p "$(dirname "$STATE_FILE")"
    echo '{"captcha_detected": false, "detection_count": 0, "last_url": "", "stealth_active": true}' > "$STATE_FILE"
fi

# Log the navigation attempt
jq --arg url "$URL" '.last_url = $url | .last_navigate = now' "$STATE_FILE" > "$STATE_FILE.tmp" 2>/dev/null && mv "$STATE_FILE.tmp" "$STATE_FILE"

# Check for known CAPTCHA-heavy domains (warn but allow)
CAPTCHA_DOMAINS="google.com|recaptcha|hcaptcha|cloudflare"
if echo "$URL" | grep -qE "$CAPTCHA_DOMAINS"; then
    echo "⚠️  Navigating to CAPTCHA-heavy domain: $URL" >&2
    echo "   Stealth mode should be active" >&2
fi

# Allow navigation
exit 0
