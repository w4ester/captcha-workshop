#!/bin/bash
# PostToolUse Hook - CAPTCHA Detection ("Land Ho!")
#
# After navigation, check for CAPTCHA signals
# Updates state file for Ralph loop awareness
#
# Exit Codes:
#   0 = No CAPTCHA detected (or handled)
#   (Note: Exit 2 here just shows warning, tool already executed)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
STATE_FILE="$PROJECT_DIR/.claude/captcha-state.json"

# Read tool output from stdin
INPUT=$(cat)
TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_output // empty')
URL=$(echo "$INPUT" | jq -r '.tool_input.url // .tool_input.file_path // empty')

# CAPTCHA detection patterns
CAPTCHA_PATTERNS=(
    "recaptcha"
    "hcaptcha" 
    "cf-turnstile"
    "challenge-platform"
    "g-recaptcha"
    "captcha-delivery"
    "arkoselabs"
    "funcaptcha"
    "checkbox captcha"
    "verify you are human"
    "prove you're not a robot"
    "security check"
    "access denied"
    "blocked"
    "unusual traffic"
)

# Check output for CAPTCHA patterns
captcha_found=""
for pattern in "${CAPTCHA_PATTERNS[@]}"; do
    if echo "$TOOL_OUTPUT" | grep -qi "$pattern"; then
        captcha_found="$pattern"
        break
    fi
done

if [ -n "$captcha_found" ]; then
    # CAPTCHA DETECTED! 🚢 LAND HO!
    
    # Update state
    current_count=$(jq -r '.detection_count // 0' "$STATE_FILE" 2>/dev/null || echo "0")
    new_count=$((current_count + 1))
    
    jq --arg pattern "$captcha_found" \
       --arg url "$URL" \
       --argjson count "$new_count" \
       '.captcha_detected = true | .detection_count = $count | .last_pattern = $pattern | .detected_at = now | .detected_url = $url' \
       "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
    
    # Output Land Ho! alert
    cat << EOF

╔══════════════════════════════════════════════════════════════╗
║  🚢 LAND HO! CAPTCHA DETECTED!                               ║
╚══════════════════════════════════════════════════════════════╝
   Pattern: $captcha_found
   URL: $URL
   Detection #: $new_count
   
   The browser encountered a CAPTCHA challenge.
   Consider:
   - Using /ralph-loop for automated retry with different strategies
   - Manually solving the CAPTCHA
   - Trying a different approach

EOF
    
    # Note: Exit 2 here shows message to Claude but tool already executed
    # We just want to inform, not block (navigation already happened)
    exit 0
else
    # No CAPTCHA - clear detection flag if previously set
    if [ -f "$STATE_FILE" ]; then
        jq '.captcha_detected = false' "$STATE_FILE" > "$STATE_FILE.tmp" 2>/dev/null && mv "$STATE_FILE.tmp" "$STATE_FILE"
    fi
fi

exit 0
