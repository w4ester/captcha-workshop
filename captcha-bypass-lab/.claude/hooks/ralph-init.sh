#!/bin/bash
# Ralph Loop Initializer
# Usage: ralph-init.sh "Your task prompt" [max_iterations] [completion_promise]

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
RALPH_STATE="$PROJECT_DIR/.claude/ralph-state.json"
HISTORY_FILE="$PROJECT_DIR/.claude/ralph-history.jsonl"

PROMPT="$1"
MAX_ITER="${2:-10}"
PROMISE="${3:-TASK_COMPLETE}"

mkdir -p "$(dirname "$RALPH_STATE")"

# Create Ralph state
cat > "$RALPH_STATE" << EOF
{
  "active": true,
  "iteration": 0,
  "max_iterations": $MAX_ITER,
  "original_prompt": $(echo "$PROMPT" | jq -Rs .),
  "completion_promise": "$PROMISE",
  "started_at": "$(date -Iseconds)",
  "strategies_tried": [],
  "captcha_encounters": 0
}
EOF

# Clear previous history for this run
echo "" > "$HISTORY_FILE"

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║  🔄 RALPH WIGGUM LOOP ACTIVATED                                  ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  Max Iterations: $MAX_ITER"
echo "║  Completion: Look for '$PROMISE'"
echo "║  Task: ${PROMPT:0:50}..."
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "  ┌─────────────────────────────────────────┐"
echo "  │  ITERATION COUNTDOWN: $MAX_ITER remaining      │"
echo "  │  ░░░░░░░░░░░░░░░░░░░░ 0%              │"
echo "  └─────────────────────────────────────────┘"
echo ""
