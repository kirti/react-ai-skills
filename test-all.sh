#!/bin/bash

echo "🧪 React AI Skills - Complete Test Suite"
echo "========================================"
echo ""

# Install first
if [ ! -d "node_modules" ]; then
  echo "📥 Installing dependencies..."
  npm install
  echo ""
fi

echo "1️⃣ Dependency Check..."
npm run deps:dry-run 2>&1 | tail -20

echo ""
echo "2️⃣ Duplicate Detection..."
npm run detect:duplicates 2>&1 | tail -10

echo ""
echo "3️⃣ Accessibility Check..."
npm run a11y:check 2>&1 | tail -10

echo ""
echo "4️⃣ TestCafe Coverage..."
npm run testcafe:coverage 2>&1 | tail -10

echo ""
echo "5️⃣ Skills Validation..."
npm run validate:skills

echo ""
echo "6️⃣ Comprehensive Maintenance..."
npm run maintain:dry-run 2>&1 | tail -30

echo ""
echo "📊 Reports Generated:"
ls -1 reports/

echo ""
echo "✅ All Tests Complete!"
