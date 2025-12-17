#!/usr/bin/env bash
set -euo pipefail

# Starts a TCP proxy (9293 -> 9494), starts ngrok on 9494, and runs shopify app dev --tunnel-url <ngrok-url>

PROXY_PORT=${PROXY_PORT:-9293}
APP_PORT=${APP_PORT:-9494}
NGROK_OUT=/tmp/ngrok.out

cleanup() {
  echo "Cleaning up..."
  [ -n "${NGROK_PID:-}" ] && kill "${NGROK_PID}" 2>/dev/null || true
  [ -n "${PROXY_PID:-}" ] && kill "${PROXY_PID}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

node -e "const net=require('net'); const APP_PORT=${APP_PORT}; const server=net.createServer(s=>{ const r=require('net').connect(APP_PORT,'127.0.0.1'); s.pipe(r); r.pipe(s); s.on('error',()=>r.end()); r.on('error',()=>s.end()); }); server.listen(${PROXY_PORT},()=>console.log('proxy listening ${PROXY_PORT}->${APP_PORT}')); setInterval(()=>{},1<<30);" &
PROXY_PID=$!
sleep 1

echo "Started proxy (PID=${PROXY_PID}). Starting ngrok (npx) on port ${APP_PORT}..."

# Start ngrok via npx and capture output
NG_CACHE_DIR="/tmp/ngrok-npm-cache-$$"
mkdir -p "${NG_CACHE_DIR}"
echo "Using temporary npm cache: ${NG_CACHE_DIR}"
NPM_CONFIG_CACHE="${NG_CACHE_DIR}" npx --yes ngrok http ${APP_PORT} --log=stdout > "${NGROK_OUT}" 2>&1 &
NGROK_PID=$!

echo "Waiting for ngrok URL (checking ${NGROK_OUT})..."
for i in {1..30}; do
  # ngrok v3 prints forwarded URLs; search for https://
  if grep -m1 -Eo 'https://[a-z0-9.-]+\.ngrok\.io(:[0-9]+)?' "${NGROK_OUT}" >/tmp/ngrok.url 2>/dev/null; then
    break
  fi
  if grep -m1 -Eo 'https://[a-z0-9.-]+' "${NGROK_OUT}" >/tmp/ngrok.url 2>/dev/null; then
    break
  fi
  sleep 1
done

if [ -s /tmp/ngrok.url ]; then
  NGROK_URL=$(head -n1 /tmp/ngrok.url)
  echo "Ngrok URL: ${NGROK_URL}"
  echo "Starting shopify with --tunnel-url ${NGROK_URL} (APP_PORT=${APP_PORT})"
  PORT=${APP_PORT} SHOPIFY_APP_URL=${NGROK_URL} shopify app dev --tunnel-url "${NGROK_URL}"
  EXIT_CODE=$?
  echo "shopify exited with ${EXIT_CODE}"
  exit ${EXIT_CODE}
else
  echo "Failed to obtain ngrok URL. Tail of ${NGROK_OUT}:"
  tail -n 200 "${NGROK_OUT}" || true
  exit 1
fi
