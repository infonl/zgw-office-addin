#!/bin/sh
#
# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+
#
# Simple script to test the entrypoint script in a controlled environment.
#
# There are no automated checks, so the user has to manually verify the replacement is correct.
# The final output of this script is the diff between the original and test src directories to
# make the manual verification easier.

# Define paths
ROOT_DIR="$(pwd)"
SRC_DIR="$ROOT_DIR/src"
MANIFEST_FILE="$ROOT_DIR/manifest.xml"
TEST_DIR="$ROOT_DIR/build/test"
TEST_SRC="$TEST_DIR/src"
TEST_MANIFEST="$TEST_DIR/manifest.xml"

# Clean and recreate test environment
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"

# Copy source directory and manifest file
#cp -r "$SRC_DIR" "$TEST_SRC"
cp "$MANIFEST_FILE" "$TEST_MANIFEST"

touch "$TEST_DIR/sed.log"
# Save the real sed path
# Override sed in the test environment
sed() {
  echo "[MOCK SED] $@" >> "$LOG_DIR/sed.log"

  # Inject backup suffix for in-place editing
  if [ "$1" = "-i" ]; then
    shift
    command sed -i '' "$@"
  else
    command sed "$@"
  fi
}
export -f sed 2>/dev/null  # export for subshells (bash), ignore error in sh

# Set test environment variables
export FRONTEND_URL="https://testfrontend.com"
export BACKEND_PUBLIC_URL="https://testfrontend.com/proxy/"
export BACKEND_URL="https://testbackend.com/"
export NGINX_PUBLIC_HTML="$TEST_DIR"
export NGINX_CONFIG_FILE="$TEST_DIR/test.conf"
export NGINX_TEMPLATES_DIR="$ROOT_DIR"
export MAX_UPLOAD_SIZE="555M"

#Copy source files to test directory
cp -r "$SRC_DIR" "$TEST_SRC"
touch "$NGINX_CONFIG_FILE"

# Run the actual script
LOG_DIR=$TEST_DIR ./entrypoint.sh

# Remove backup files created by sed
find "$TEST_DIR" -type f -name '*-e' -exec rm {} +

# Compare the original and test src directories
diff -ru "$SRC_DIR" "$TEST_SRC"

# Compare the original and test manifest.xml
diff -u "$MANIFEST_FILE" "$TEST_MANIFEST"
diff -u "$ROOT_DIR/nginx.conf.template" "$NGINX_CONFIG_FILE"
