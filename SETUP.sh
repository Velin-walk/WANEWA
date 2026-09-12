#!/bin/bash

# Walk Nepal Walk - File Setup Script
# This script copies all generated files to your existing project

set -e

echo "🚀 Walk Nepal Walk - Setup Script"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "walk-nepal-generated" ]; then
    echo -e "${RED}❌ Error: walk-nepal-generated directory not found${NC}"
    echo "Please run this script from the parent directory of walk-nepal-generated/"
    exit 1
fi

# Define target directories
BACKEND_DIR="../backend"
MOBILE_DIR="../mobile"

# Prompt for confirmation
echo -e "${YELLOW}⚠️  This script will copy generated files to:${NC}"
echo "  - Backend: $BACKEND_DIR"
echo "  - Mobile: $MOBILE_DIR"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "📁 Copying backend files..."

# Backend middleware
if [ -d "$BACKEND_DIR/src/middleware" ]; then
    cp walk-nepal-generated/backend/src/middleware/*.ts $BACKEND_DIR/src/middleware/
    echo "  ✅ Middleware files copied"
else
    echo -e "${RED}  ❌ $BACKEND_DIR/src/middleware not found${NC}"
fi

# Backend database
if [ -d "$BACKEND_DIR/src/database" ]; then
    cp walk-nepal-generated/backend/src/database/*.ts $BACKEND_DIR/src/database/
    echo "  ✅ Database files copied"
else
    echo -e "${RED}  ❌ $BACKEND_DIR/src/database not found${NC}"
fi

# Backend index.ts
if [ -d "$BACKEND_DIR/src" ]; then
    cp walk-nepal-generated/backend/src/index.ts $BACKEND_DIR/src/
    echo "  ✅ index.ts copied"
else
    echo -e "${RED}  ❌ $BACKEND_DIR/src not found${NC}"
fi

# Backend env
if [ -f "$BACKEND_DIR" ]; then
    cp walk-nepal-generated/.env.example.backend $BACKEND_DIR/.env.local
    echo "  ✅ Environment template copied"
else
    echo -e "${YELLOW}  ⚠️  Skipped .env.local${NC}"
fi

echo ""
echo "📱 Copying mobile files..."

# Mobile services
if [ -d "$MOBILE_DIR/src/services" ]; then
    cp walk-nepal-generated/mobile/src/services/*.ts $MOBILE_DIR/src/services/
    echo "  ✅ Services copied"
else
    mkdir -p $MOBILE_DIR/src/services
    cp walk-nepal-generated/mobile/src/services/*.ts $MOBILE_DIR/src/services/
    echo "  ✅ Services copied (directory created)"
fi

# Mobile store/redux
if [ -d "$MOBILE_DIR/src/store/redux" ]; then
    cp walk-nepal-generated/mobile/src/store/redux/*.ts $MOBILE_DIR/src/store/redux/
    echo "  ✅ Redux files copied"
else
    mkdir -p $MOBILE_DIR/src/store/redux
    cp walk-nepal-generated/mobile/src/store/redux/*.ts $MOBILE_DIR/src/store/redux/
    echo "  ✅ Redux files copied (directory created)"
fi

# Mobile store hooks
if [ -f "walk-nepal-generated/mobile/src/store/hooks.ts" ]; then
    cp walk-nepal-generated/mobile/src/store/hooks.ts $MOBILE_DIR/src/store/
    echo "  ✅ Store hooks copied"
fi

# Mobile components
if [ -d "$MOBILE_DIR/src/components" ]; then
    cp walk-nepal-generated/mobile/src/components/*.tsx $MOBILE_DIR/src/components/
    echo "  ✅ Components copied"
else
    mkdir -p $MOBILE_DIR/src/components
    cp walk-nepal-generated/mobile/src/components/*.tsx $MOBILE_DIR/src/components/
    echo "  ✅ Components copied (directory created)"
fi

# Mobile screens
if [ -d "$MOBILE_DIR/src/screens" ]; then
    cp walk-nepal-generated/mobile/src/screens/*.tsx $MOBILE_DIR/src/screens/
    echo "  ✅ Screens copied"
else
    mkdir -p $MOBILE_DIR/src/screens
    cp walk-nepal-generated/mobile/src/screens/*.tsx $MOBILE_DIR/src/screens/
    echo "  ✅ Screens copied (directory created)"
fi

# Mobile utils
if [ -d "$MOBILE_DIR/src/utils" ]; then
    cp walk-nepal-generated/mobile/src/utils/*.ts $MOBILE_DIR/src/utils/
    echo "  ✅ Utils copied"
else
    mkdir -p $MOBILE_DIR/src/utils
    cp walk-nepal-generated/mobile/src/utils/*.ts $MOBILE_DIR/src/utils/
    echo "  ✅ Utils copied (directory created)"
fi

# Mobile types
if [ -d "$MOBILE_DIR/src/types" ]; then
    cp walk-nepal-generated/mobile/src/types/index.ts $MOBILE_DIR/src/types/
    echo "  ✅ Types copied"
else
    mkdir -p $MOBILE_DIR/src/types
    cp walk-nepal-generated/mobile/src/types/index.ts $MOBILE_DIR/src/types/
    echo "  ✅ Types copied (directory created)"
fi

# Mobile env
if [ -d "$MOBILE_DIR" ]; then
    cp walk-nepal-generated/.env.example.mobile $MOBILE_DIR/.env
    echo "  ✅ Environment template copied"
else
    echo -e "${YELLOW}  ⚠️  Skipped .env${NC}"
fi

echo ""
echo "📖 Setting up documentation..."

# Documentation
if [ -d "docs" ]; then
    cp walk-nepal-generated/docs/*.md docs/
    echo "  ✅ Documentation copied to docs/"
else
    mkdir -p docs
    cp walk-nepal-generated/docs/*.md docs/
    echo "  ✅ Documentation copied to docs/"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "  1. Review the environment files (.env.local and .env)"
echo "  2. Update with your Firebase credentials"
echo "  3. Follow the INTEGRATION_CHECKLIST.md"
echo "  4. Run: npm install (in both backend and mobile)"
echo "  5. Test locally before deploying"
echo ""
echo "📚 Documentation:"
echo "  - Backend setup: docs/README.md"
echo "  - Integration: docs/INTEGRATION_CHECKLIST.md"
echo "  - File guide: docs/GENERATED_FILES_SUMMARY.md"
echo ""
echo "Happy coding! 🚀"
