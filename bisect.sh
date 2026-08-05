#!/bin/bash
cp test_snippet.tsx temp.tsx

# Try deleting the mapping block
sed -i '/custLandingConfig.alumniClasses?.map/,/})}/d' temp.tsx
npx tsc --noEmit temp.tsx --jsx react > output.txt 2>&1
cat output.txt
