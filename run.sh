#!/bin/bash

# Function to handle cleanup on script exit
cleanup() {
    echo "Stopping all processes..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set up trap to catch script termination
trap cleanup SIGINT SIGTERM

# Activate Python virtual environment and start backend server
echo "Starting backend server..."
cd ./backend
source venv/Scripts/activate
python server.py &
BACKEND_PID=$!

# Start frontend application
echo "Starting frontend application..."
cd ../frontend
npm run start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 