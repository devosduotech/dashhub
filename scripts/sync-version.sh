#!/usr/bin/env bash
# Syncs the version from package.json to README.md and docker-compose.yml
# Run after bumping version: bash scripts/sync-version.sh

set -euo pipefail
cd "$(dirname "$0")/.."

VERSION=$(python3 -c "import json; print(json.load(open('package.json'))['version'])")
echo "Syncing version: $VERSION"

# README.md — Docker Images table
sed -i "s/| \`[0-9]*\.[0-9]*\.[0-9]*\` | Current release |/| \`$VERSION\` | Current release |/" README.md

# docker-compose.yml — image tag
sed -i "s|ghcr.io/devosduotech/dashhub:[0-9]*\.[0-9]*\.[0-9]*|ghcr.io/devosduotech/dashhub:$VERSION|g" docker-compose.yml

echo "Done. Updated README.md and docker-compose.yml to $VERSION"
