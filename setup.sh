#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "========================================="
echo "Initializing OnlyCashbacks Setup for Jules"
echo "========================================="

# 1. Verify Node.js and npm presence
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH." >&2
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed or not in PATH." >&2
    exit 1
fi

echo "✓ Node.js $(node -v) and npm $(npm -v) detected."

# 2. Handle environment configuration file (.env)
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created successfully."
else
    echo "✓ .env file already exists."
fi

# 3. Install project dependencies
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed successfully."

# 4. Verify the setup by running a clean build
echo "Running validation build..."
npm run build
echo "✓ Validation build completed successfully."

echo "========================================="
echo "Setup completed successfully! Ready for Jules."
echo "========================================="
