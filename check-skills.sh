#!/bin/bash

echo "📚 React AI Skills - Complete Check"
echo "===================================="
echo ""

cd skills

# 1. Count skills
SKILL_COUNT=$(find . -name "SKILL.md" | wc -l | tr -d ' ')
echo "📊 Total Skills: $SKILL_COUNT"
echo ""

# 2. List each skill
echo "📋 Skills Found:"
for skill in */SKILL.md; do
  if [ -f "$skill" ]; then
    dir=$(dirname "$skill")
    lines=$(wc -l < "$skill" | tr -d ' ')
    echo "  ✅ $dir ($lines lines)"
  fi
done
echo ""

# 3. Check for issues
echo "🔍 Checking for issues..."

# No .cursor folder
if [ -d ".cursor" ]; then
  echo "  ❌ .cursor folder found (should be removed)"
else
  echo "  ✅ No .cursor folder"
fi

# README exists
if [ -f "README.md" ]; then
  echo "  ✅ README.md exists"
else
  echo "  ⚠️  No README.md (should create one)"
fi

# Install script exists
if [ -f "install-skills.sh" ]; then
  echo "  ✅ install-skills.sh exists"
else
  echo "  ⚠️  No install-skills.sh (should create one)"
fi

echo ""
echo "✅ Skills check complete!"
