#!/bin/bash
set -e
echo "Starting server..."
pnpm exec tsx server/index.ts &
SERVER_PID=$!

echo "Starting Vite..."
pnpm exec vite &
CLIENT_PID=$!

trap "kill $SERVER_PID $CLIENT_PID" INT
wait
