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

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    source venv/bin/activate
else
    source venv/Scripts/activate
fi

python server.py &
BACKEND_PID=$!

# Start frontend application
echo "Starting frontend application..."
cd ../frontend
yarn dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 
