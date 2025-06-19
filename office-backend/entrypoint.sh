#!/bin/bash
set -e

# Check if GENERATE_SELF_SIGNED environment variable is set to true
if [ "$GENERATE_SELF_SIGNED" = "true" ]; then
  echo "Generating self-signed keys..."
  ./generate-keys.sh
fi

# Start the Node.js application
echo "Starting the Node.js application..."
node dist/office-backend/src/app.js
