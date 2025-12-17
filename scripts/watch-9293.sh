#!/usr/bin/env bash
# Watcher: polls lsof for port 9293 and logs the first binder
# Usage: ./scripts/watch-9293.sh [logfile] [interval_seconds]

LOG=${1:-/tmp/9293-watcher.log}
INTERVAL=${2:-0.25}

echo "$(date --iso-8601=seconds) - watcher started, logging to $LOG" >> "$LOG"

while true; do
  lsof -nP -iTCP:9293 -sTCP:LISTEN -Pn > /tmp/9293-lsof.tmp 2>/dev/null || true
  if [ -s /tmp/9293-lsof.tmp ]; then
    echo "$(date --iso-8601=seconds) - port 9293 bound" >> "$LOG"
    cat /tmp/9293-lsof.tmp >> "$LOG"
    PIDS=$(awk 'NR>1 {print $2}' /tmp/9293-lsof.tmp | sort -u)
    for PID in $PIDS; do
      echo "---- process $PID ----" >> "$LOG"
      ps -p $PID -o pid,user,comm,args >> "$LOG" 2>&1 || true
      lsof -p $PID -nP -a -iTCP -sTCP:LISTEN -Pn >> "$LOG" 2>&1 || true
    done
    echo "$(date --iso-8601=seconds) - watcher: captured binder and exiting" >> "$LOG"
    exit 0
  fi
  sleep "$INTERVAL"
done
