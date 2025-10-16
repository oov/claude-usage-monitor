#!/bin/bash

# Claude Usage Monitor - Release Build Script
# Creates a zip archive for distribution

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get version from manifest.json
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)

if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Could not extract version from manifest.json${NC}"
    exit 1
fi

echo -e "${GREEN}Building Claude Usage Monitor v${VERSION}${NC}"

# Output filename
OUTPUT_DIR="dist"
OUTPUT_FILE="${OUTPUT_DIR}/claude-usage-monitor-v${VERSION}.zip"

# Create dist directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Files to include in the release (runtime files only)
FILES=(
    "manifest.json"
    "background.js"
    "monitor.html"
    "monitor.js"
    "icon.png"
)

# Check if all required files exist
echo -e "${YELLOW}Checking required files...${NC}"
MISSING_FILES=0
for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: Missing required file: $file${NC}"
        MISSING_FILES=1
    else
        echo -e "  ✓ $file"
    fi
done

if [ $MISSING_FILES -eq 1 ]; then
    exit 1
fi

# Remove old archive if it exists
if [ -f "$OUTPUT_FILE" ]; then
    echo -e "${YELLOW}Removing old archive...${NC}"
    rm "$OUTPUT_FILE"
fi

# Detect environment and use appropriate zip method
echo -e "${YELLOW}Creating zip archive...${NC}"

if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows environment - use PowerShell
    echo -e "${YELLOW}Detected Windows environment, using PowerShell...${NC}"

    # Convert to Windows path format
    WIN_OUTPUT_FILE=$(cygpath -w "$OUTPUT_FILE" 2>/dev/null || echo "$OUTPUT_FILE")

    # Create PowerShell command to compress files
    powershell.exe -NoProfile -Command "
        \$files = @(
            $(printf '"%s",' "${FILES[@]}" | sed 's/,$//')
        );
        Compress-Archive -Path \$files -DestinationPath '$WIN_OUTPUT_FILE' -Force
    "

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: PowerShell compression failed${NC}"
        exit 1
    fi
else
    # Unix/Linux environment - use zip command
    if ! command -v zip &> /dev/null; then
        echo -e "${RED}Error: zip command not found${NC}"
        echo -e "${YELLOW}Please install zip: sudo apt-get install zip (or equivalent)${NC}"
        exit 1
    fi

    zip -q "$OUTPUT_FILE" "${FILES[@]}"

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: zip command failed${NC}"
        exit 1
    fi
fi

# Check if zip was created successfully
if [ -f "$OUTPUT_FILE" ]; then
    FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo -e "${GREEN}✓ Successfully created: $OUTPUT_FILE (${FILE_SIZE})${NC}"
    echo ""
    echo -e "${GREEN}Archive contents:${NC}"

    # List archive contents using appropriate tool
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        powershell.exe -NoProfile -Command "
            Get-ChildItem -Path '$WIN_OUTPUT_FILE' | Select-Object -ExpandProperty FullName | ForEach-Object {
                [System.IO.Compression.ZipFile]::OpenRead(\$_).Entries | Format-Table -Property Name, Length
            }
        " 2>/dev/null || echo "  (Use file explorer to view contents)"
    else
        unzip -l "$OUTPUT_FILE"
    fi

    echo ""
    echo -e "${GREEN}Release package ready!${NC}"
else
    echo -e "${RED}Error: Failed to create archive${NC}"
    exit 1
fi
