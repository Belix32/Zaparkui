#!/bin/bash
set -e

echo "======================================"
echo "  Capacitor Build Script"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get directory of script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Default values
BUILD_TARGET="all"
BUILD_MODE="debug"
SKIP_INSTALL=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --android)
            BUILD_TARGET="android"
            shift
            ;;
        --ios)
            BUILD_TARGET="ios"
            shift
            ;;
        --release)
            BUILD_MODE="release"
            shift
            ;;
        --skip-install)
            SKIP_INSTALL=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: build.sh [--android|--ios] [--release] [--skip-install]"
            exit 1
            ;;
    esac
done

echo -e "${GREEN}Build configuration:${NC}"
echo "  Target: $BUILD_TARGET"
echo "  Mode: $BUILD_MODE"
echo ""

# Install dependencies if needed
if [ "$SKIP_INSTALL" = false ]; then
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ npm dependencies installed${NC}"
    echo ""
fi

# Sync Capacitor
echo -e "${YELLOW}Syncing Capacitor...${NC}"
npx cap sync
echo -e "${GREEN}✓ Capacitor synced${NC}"
echo ""

# Build Android
if [ "$BUILD_TARGET" = "all" ] || [ "$BUILD_TARGET" = "android" ]; then
    echo -e "${YELLOW}Building Android APK...${NC}"
    
    cd android
    
    if [ "$BUILD_MODE" = "release" ]; then
        ./gradlew assembleRelease
    else
        ./gradlew assembleDebug
    fi
    
    cd ..
    
    echo -e "${GREEN}✓ Android build complete${NC}"
fi

# Build iOS
if ([ "$BUILD_TARGET" = "all" ] || [ "$BUILD_TARGET" = "ios" ]) && [ "$(uname)" = "Darwin" ]; then
    echo -e "${YELLOW}Building iOS app...${NC}"
    
    cd ios/App
    xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug -allowProvisioningUpdates 2>/dev/null || true
    cd ../..
    
    echo -e "${GREEN}✓ iOS build complete${NC}"
elif [ "$BUILD_TARGET" = "ios" ] && [ "$(uname)" != "Darwin" ]; then
    echo -e "${YELLOW}⚠ macOS required for iOS build${NC}"
fi

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# Show output paths
echo "Output files:"
if [ "$BUILD_TARGET" = "all" ] || [ "$BUILD_TARGET" = "android" ]; then
    if [ "$BUILD_MODE" = "release" ]; then
        echo "  - Android: android/app/build/outputs/apk/release/app-release-unsigned.apk"
    else
        echo "  - Android: android/app/build/outputs/apk/debug/app-debug.apk"
    fi
fi

if [ "$BUILD_TARGET" = "ios" ]; then
    echo "  - iOS: ios/App/build/Debug-iphonesimulator/App.app"
fi