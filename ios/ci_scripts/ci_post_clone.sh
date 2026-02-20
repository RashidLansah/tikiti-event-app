#!/bin/sh

# Xcode Cloud post-clone script
# Installs CocoaPods dependencies after cloning the repo

echo "Installing CocoaPods..."
brew install cocoapods

echo "Installing pods..."
cd "$CI_PRIMARY_REPOSITORY_PATH/ios"
pod install

echo "Pods installed successfully!"
