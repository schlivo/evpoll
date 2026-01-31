#!/bin/bash

# Start backend in background
echo "Starting backend..."
cd /workspace/backend && npm run dev &

# Wait a bit for backend to start
sleep 2

# Start frontend
echo "Starting frontend..."
cd /workspace/frontend && npm run dev
