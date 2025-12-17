#!/usr/bin/env bash
set -euo pipefail

# Starts a TCP proxy (9293 -> 9494), starts localtunnel on 9494, and runs shopify app dev
# Logs localtunnel output to /tmp/lt.out

PROXY_PORT=${PROXY_PORT:-9293}
APP_PORT=${APP_PORT:-9494}
LT_OUT=/tmp/lt.out

cleanup() {
  echo "Cleaning up..."
  [ -n "${LT_PID:-}" ] && kill "${LT_PID}" 2>/dev/null || true
  [ -n "${PROXY_PID:-}" ] && kill "${PROXY_PID}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Start node-based TCP proxy in background
node -e "const net=require('net'); const APP_PORT=${APP_PORT}; const server=net.createServer(s=>{ const r=require('net').connect(APP_PORT,'127.0.0.1'); s.pipe(r); r.pipe(s); s.on('error',()=>r.end()); r.on('error',()=>s.end()); }); server.listen(${PROXY_PORT},()=>console.log('proxy listening ${PROXY_PORT}->${APP_PORT}')); setInterval(()=>{},1<<30);" &
PROXY_PID=$!
sleep 1

echo "Started proxy (PID=${PROXY_PID}). Starting localtunnel (npx) on port ${APP_PORT}..."
# Start localtunnel in background
npx --yes localtunnel --port ${APP_PORT} > "${LT_OUT}" 2>&1 &
LT_PID=$!

# Wait for localtunnel to write a URL
echo "Waiting for tunnel URL (checking ${LT_OUT})..."
for i in {1..30}; do
  if grep -m1 -Eo 'https?://[^ ]+' "${LT_OUT}" >/tmp/lt.url 2>/dev/null; then
    break
  fi
  sleep 1
done

if [ -s /tmp/lt.url ]; then
  LT_URL=$(head -n1 /tmp/lt.url)
  # Optionally append :443 to the tunnel URL if APPEND_TUNNEL_PORT=1
  if [ "${APPEND_TUNNEL_PORT:-0}" = "1" ]; then
    LT_URL="${LT_URL}:443"
  fi
  echo "Local tunnel URL: ${LT_URL}"
  echo "Starting shopify with --tunnel-url ${LT_URL} (APP_PORT=${APP_PORT})"
  PORT=${APP_PORT} SHOPIFY_APP_URL=${LT_URL} shopify app dev --tunnel-url "${LT_URL}"
  EXIT_CODE=$?
  echo "shopify exited with ${EXIT_CODE}"
  exit ${EXIT_CODE}
else
  echo "Failed to obtain tunnel URL. Tail of ${LT_OUT}:"
  tail -n 200 "${LT_OUT}" || true
  exit 1
fi
