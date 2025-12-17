#!/usr/bin/env bash
set -euo pipefail

# Dev helper: run the app on an alternate port and forward 9293 -> APP_PORT with socat
# Usage: bash ./scripts/dev-with-proxy.sh

PROXY_PORT=9293
APP_PORT=9494
SOCAT_CMD="socat TCP-LISTEN:${PROXY_PORT},fork,reuseaddr TCP:127.0.0.1:${APP_PORT}"

# Check for socat
if ! command -v socat >/dev/null 2>&1; then
  echo "socat is required but not installed. On macOS install with:"
  echo "  brew install socat"
  exit 1
fi

# Find any process listening on PROXY_PORT
LISTENER_PID=$(lsof -tiTCP:${PROXY_PORT} -sTCP:LISTEN || true)
if [ -n "${LISTENER_PID}" ]; then
  echo "Found a process listening on port ${PROXY_PORT}: PID=${LISTENER_PID}"
  # Only attempt to kill obvious node/shopify processes
  PROC_CMD=$(ps -p ${LISTENER_PID} -o comm= || true)
  echo "Process command: ${PROC_CMD}"
  if echo "${PROC_CMD}" | grep -Ei "node|shopify|nodejs" >/dev/null 2>&1; then
    echo "Killing ${PROC_CMD} (PID ${LISTENER_PID}) to free port ${PROXY_PORT}"
    kill ${LISTENER_PID} || true
    sleep 1
    # re-check
    if lsof -tiTCP:${PROXY_PORT} -sTCP:LISTEN >/dev/null 2>&1; then
      echo "Port ${PROXY_PORT} still in use after kill. Exiting to avoid unsafe kills."
      exit 1
    fi
  else
    echo "Process on ${PROXY_PORT} is not an obvious node/shopify process. Please stop it manually and retry." 
    exit 1
  fi
fi

# Start socat in background and make sure we kill it on exit
echo "Starting socat: ${SOCAT_CMD}"
# shellcheck disable=SC2086
${SOCAT_CMD} &
SOCAT_PID=$!

cleanup() {
  echo "Stopping socat (PID ${SOCAT_PID})"
  kill ${SOCAT_PID} >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

# Start the dev server on APP_PORT and make the app available via PROXY_PORT
# Use SHOPIFY_APP_URL so Vite/hosted server and Shopify know where the app is reachable.
export PORT=${APP_PORT}
export SHOPIFY_APP_URL="http://localhost:${APP_PORT}"
export BROWSER=none

echo "Running: PORT=${APP_PORT} SHOPIFY_APP_URL=http://localhost:${APP_PORT} BROWSER=none shopify app dev"
PORT=${APP_PORT} SHOPIFY_APP_URL="http://localhost:${APP_PORT}" BROWSER=none shopify app dev

# When the shopify CLI exits the trap will kill socat
