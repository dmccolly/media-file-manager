#!/bin/bash

# Fix all Netlify functions to use correct Xano endpoint
OLD_URL="https://xajo-bs7d-cagt.n7e.xano.io/api:pYeQctVX"
NEW_URL="https://x3o5-9jqb-qs8e.n7c.xano.io/api:6SHl5baF"

OLD_ENDPOINT="user_submission"
NEW_ENDPOINT="media_files"

echo "Fixing Xano endpoints in Netlify functions..."

# Update all function files
for file in netlify/functions/*.mts; do
    if grep -q "$OLD_URL" "$file"; then
        echo "Updating $file..."
        sed -i "s|$OLD_URL|$NEW_URL|g" "$file"
        sed -i "s|$OLD_ENDPOINT|$NEW_ENDPOINT|g" "$file"
    fi
done

echo "Done! All functions updated."