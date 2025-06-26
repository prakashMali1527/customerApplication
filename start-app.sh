#!/bin/bash

echo "Starting People Management App server..."
echo "Once the server starts, open your browser and navigate to: http://localhost:3000"
echo "Press Ctrl+C to stop the server when done."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Run the development server
npm run dev 