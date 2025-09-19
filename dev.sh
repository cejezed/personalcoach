#!/bin/bash

# Install dependencies
pnpm -w install

# Start server in background
echo "Starting server..."
cd apps/server
PORT=${PORT:-8080} pnpm dev &
SERVER_PID=$!

# Start client
echo "Starting client..."
cd ../client
PORT=${PORT:-5000} pnpm dev &
CLIENT_PID=$!

# Wait for both processes
wait $SERVER_PID $CLIENT_PID
