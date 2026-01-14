#!/bin/bash
# Stop Hook - Ralph Wiggum Pattern with Iteration Countdown
#
# Features:
# - Visual countdown of remaining iterations
# - Progress bar
# - Strategy rotation for CAPTCHA bypass
# - Historical tracking for analysis
#
# Exit Codes:
#   0 = Allow stop
#   2 = Block stop, force continuation

set -e

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
STATE_FILE="$PROJECT_DIR/.claude/captcha-state.json"
RALPH_STATE="$PROJECT_DIR/.claude/ralph-state.json"
HISTORY_FILE="$PROJECT_DIR/.claude/ralph-history.jsonl"
STATS_FILE="$PROJECT_DIR/.claude/ralph-stats.json"

# Generate progress bar
progress_bar() {
    local current=$1
    local max=$2
    local width=20
    local percent=$((current * 100 / max))
    local filled=$((current * width / max))
    local empty=$((width - filled))
    
    local bar=""
    for ((i=0; i<filled; i++)); do bar+="█"; done
    for ((i=0; i<empty; i++)); do bar+="░"; done
    
    echo "$bar $percent%"
}

# Check if Ralph loop is active
is_ralph_active() {
    if [ -f "$RALPH_STATE" ]; then
        local active=$(jq -r '.active' "$RALPH_STATE" 2>/dev/null || echo "false")
        [ "$active" = "true" ]
    else
        return 1
    fi
}

# Get values from state
get_iteration() { jq -r '.iteration // 0' "$RALPH_STATE" 2>/dev/null || echo "0"; }
get_max_iterations() { jq -r '.max_iterations // 10' "$RALPH_STATE" 2>/dev/null || echo "10"; }
get_original_prompt() { jq -r '.original_prompt // ""' "$RALPH_STATE" 2>/dev/null || echo ""; }
get_completion_promise() { jq -r '.completion_promise // "COMPLETE"' "$RALPH_STATE" 2>/dev/null || echo "COMPLETE"; }
get_captcha_encounters() { jq -r '.captcha_encounters // 0' "$RALPH_STATE" 2>/dev/null || echo "0"; }

# Update iteration and return new value
increment_iteration() {
    local current=$(get_iteration)
    local new=$((current + 1))
    local captcha_count=$(jq -r '.detection_count // 0' "$STATE_FILE" 2>/dev/null || echo "0")
    
    jq --arg iter "$new" \
       --arg captcha "$captcha_count" \
       '.iteration = ($iter | tonumber) | .captcha_encounters = ($captcha | tonumber)' \
       "$RALPH_STATE" > "$RALPH_STATE.tmp" && mv "$RALPH_STATE.tmp" "$RALPH_STATE"
    
    echo "$new"
}

# Log iteration to history (for analysis)
log_iteration() {
    local iteration=$1
    local strategy=$2
    local outcome=$3
    local captcha_count=$4
    
    mkdir -p "$(dirname "$HISTORY_FILE")"
    echo "{\"ts\": \"$(date -Iseconds)\", \"iter\": $iteration, \"strategy\": \"$strategy\", \"outcome\": \"$outcome\", \"captchas\": $captcha_count}" >> "$HISTORY_FILE"
}

# Save final stats
save_stats() {
    local iterations=$1
    local outcome=$2
    local captcha_count=$3
    local start_time=$(jq -r '.started_at' "$RALPH_STATE" 2>/dev/null)
    
    mkdir -p "$(dirname "$STATS_FILE")"
    
    # Append to stats history
    echo "{\"completed\": \"$(date -Iseconds)\", \"started\": \"$start_time\", \"iterations\": $iterations, \"outcome\": \"$outcome\", \"captcha_encounters\": $captcha_count}" >> "$STATS_FILE"
}

# Check if we had unresolved CAPTCHA
had_captcha_issue() {
    if [ -f "$STATE_FILE" ]; then
        local detected=$(jq -r '.captcha_detected' "$STATE_FILE" 2>/dev/null || echo "false")
        [ "$detected" = "true" ]
    else
        return 1
    fi
}

# Main logic
main() {
    local response=$(cat)  # Claude's final response
    
    if is_ralph_active; then
        local iteration=$(get_iteration)
        local max=$(get_max_iterations)
        local prompt=$(get_original_prompt)
        local promise=$(get_completion_promise)
        local remaining=$((max - iteration))
        local captcha_count=$(jq -r '.detection_count // 0' "$STATE_FILE" 2>/dev/null || echo "0")
        
        # === MAX ITERATIONS REACHED ===
        if [ "$iteration" -ge "$max" ]; then
            log_iteration "$iteration" "final" "max_reached" "$captcha_count"
            save_stats "$iteration" "max_iterations" "$captcha_count"
            
            cat >&2 << EOF

╔══════════════════════════════════════════════════════════════════╗
║  🛑 RALPH LOOP COMPLETE - MAX ITERATIONS                         ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   FINAL STATS:                                                   ║
║   ┌────────────────────────────────────────┐                     ║
║   │  Iterations Used:    $iteration of $max                          
║   │  CAPTCHA Encounters: $captcha_count                               
║   │  Outcome:            Max iterations reached                  ║
║   │  $(progress_bar $iteration $max)                    
║   └────────────────────────────────────────┘                     ║
║                                                                  ║
║   Review .claude/ralph-history.jsonl for iteration details       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

EOF
            jq '.active = false | .end_reason = "max_iterations"' "$RALPH_STATE" > "$RALPH_STATE.tmp" && mv "$RALPH_STATE.tmp" "$RALPH_STATE"
            exit 0
        fi
        
        # === CHECK COMPLETION PROMISE ===
        if echo "$response" | grep -q "$promise"; then
            log_iteration "$iteration" "complete" "success" "$captcha_count"
            save_stats "$iteration" "success" "$captcha_count"
            
            cat >&2 << EOF

╔══════════════════════════════════════════════════════════════════╗
║  ✅ RALPH LOOP COMPLETE - SUCCESS!                               ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   🎉 COMPLETION PROMISE DETECTED!                                ║
║                                                                  ║
║   FINAL STATS:                                                   ║
║   ┌────────────────────────────────────────┐                     ║
║   │  Iterations Used:    $iteration of $max                          
║   │  CAPTCHA Encounters: $captcha_count                               
║   │  Outcome:            SUCCESS ✓                               ║
║   │  $(progress_bar $iteration $max)                    
║   └────────────────────────────────────────┘                     ║
║                                                                  ║
║   It took $iteration iteration(s) to complete the task!              
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

EOF
            jq '.active = false | .end_reason = "success"' "$RALPH_STATE" > "$RALPH_STATE.tmp" && mv "$RALPH_STATE.tmp" "$RALPH_STATE"
            exit 0
        fi
        
        # === CONTINUE LOOP ===
        local new_iter=$(increment_iteration)
        remaining=$((max - new_iter))
        
        # Determine strategy based on iteration and CAPTCHA state
        local strategy=""
        local strategy_name=""
        if had_captcha_issue; then
            local strat_num=$((new_iter % 5))
            case $strat_num in
                0) strategy="Add 2-5 second random delays between actions."
                   strategy_name="random_delays" ;;
                1) strategy="Use stealth browser with different user agent."
                   strategy_name="change_ua" ;;
                2) strategy="Clear all cookies, start fresh session."
                   strategy_name="clear_cookies" ;;
                3) strategy="Navigate to homepage first, then to target."
                   strategy_name="warm_navigation" ;;
                4) strategy="Simulate mouse movements before clicking."
                   strategy_name="mouse_simulation" ;;
            esac
        else
            strategy_name="no_captcha"
        fi
        
        log_iteration "$new_iter" "$strategy_name" "continuing" "$captcha_count"
        
        # Output countdown display to stderr (shown to Claude)
        cat >&2 << EOF

╔══════════════════════════════════════════════════════════════════╗
║  🔄 RALPH LOOP - ITERATION $new_iter of $max                             
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   COUNTDOWN:                                                     ║
║   ┌────────────────────────────────────────┐                     ║
║   │  ⏱️  $remaining iteration(s) remaining                           
║   │  📊 $(progress_bar $new_iter $max)                    
║   │  🚢 CAPTCHA encounters: $captcha_count                            
║   └────────────────────────────────────────┘                     ║
║                                                                  ║
${strategy:+║   🎯 STRATEGY: $strategy_name
║      $strategy
║                                                                  ║}
╚══════════════════════════════════════════════════════════════════╝

ORIGINAL TASK:
$prompt

INSTRUCTIONS:
- The task is NOT yet complete (no '$promise' found)
- Review what was done and what failed
- Try a different approach
- Output '$promise' when truly complete
- You have $remaining iteration(s) remaining

EOF
        
        # EXIT 2 = Block stop, force continuation
        exit 2
        
    else
        # Ralph not active
        if had_captcha_issue; then
            echo "⚠️  Session ended with unresolved CAPTCHA" >&2
            echo "   Consider using Ralph loop for persistent retry" >&2
        fi
        exit 0
    fi
}

main
