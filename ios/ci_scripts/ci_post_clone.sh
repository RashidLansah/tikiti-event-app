#!/bin/sh

# Xcode Cloud post-clone script
# Installs Node.js, npm dependencies, and CocoaPods for React Native / Expo builds

set -e

echo "===== Installing Node.js ====="
brew install node

echo "===== Setting NODE_BINARY ====="
export NODE_BINARY=$(which node)
echo "Node version: $(node --version)"
echo "Node path: $NODE_BINARY"

echo "===== Installing npm dependencies ====="
cd "$CI_PRIMARY_REPOSITORY_PATH"
npm install

echo "===== Installing CocoaPods ====="
brew install cocoapods

echo "===== Running pod install ====="
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install

echo "===== Build setup complete! ====="
