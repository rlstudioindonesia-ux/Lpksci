#!/bin/bash
cp test_snippet.tsx temp.tsx
sed -i '40,65d' temp.tsx
npx tsc --noEmit temp.tsx --jsx react > out1.txt 2>&1
cat out1.txt | head -n 5
