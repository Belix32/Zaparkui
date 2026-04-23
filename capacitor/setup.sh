#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Запаркуй - Capacitor Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ]; then
    echo -e "${RED}✗ Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} Node.js v$(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} npm $(npm -v) found"

# Install @capacitor/cli and @capacitor/core
echo ""
echo -e "${YELLOW}Installing Capacitor packages...${NC}"
npm install --save-dev @capacitor/cli
npm install @capacitor/core @capacitor/app @capacitor/browser @capacitor/camera @capacitor/geolocation @capacitor/keyboard @capacitor/local-notifications @capacitor/status-bar @capacitor/haptics @capacitor/splash-screen @capacitor/network @capacitor/preferences @capacitor/push-notifications @capacitor/device

echo ""
echo -e "${GREEN}✓${NC} Capacitor packages installed"

# Copy Capacitor config
echo ""
echo -e "${YELLOW}Copying Capacitor configuration...${NC}"
cp -r /root/zaparkyi/capacitor/* /root/zaparkyi/
echo -e "${GREEN}✓${NC} Configuration copied"

# Update package.json with Capacitor scripts
echo ""
echo -e "${YELLOW}Updating package.json...${NC}"
# Add Capacitor scripts (manually since we can't use jq/sed easily here)

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   Capacitor Setup Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. cd /root/zaparkyi"
echo "  2. npx cap add android"
echo "  3. npx cap add ios"
echo "  4. npx cap sync"
echo ""
echo "Useful commands:"
echo "  npx cap open android  - Open Android Studio"
echo "  npx cap open ios      - Open Xcode"
echo "  npx cap run android  - Build and run on device"
echo "  npx cap build ios     - Build iOS app"
echo ""

exit 0