#!/bin/bash

echo "📚 Installing React AI Skills..."
echo ""

# Ask user which AI tool they're using
echo "Which AI tool are you using?"
echo "1) Cursor"
echo "2) Claude Code"
echo "3) Continue (VS Code)"
echo "4) Other (manual install to ./skills)"
read -p "Enter number (1-4): " choice

case $choice in
  1) SKILLS_DIR=".cursor/skills" ;;
  2) SKILLS_DIR=".claude/skills" ;;
  3) SKILLS_DIR="$HOME/.continue/skills" ;;
  *) SKILLS_DIR="./ai-skills" ;;
esac

echo ""
echo "Installing to: $SKILLS_DIR"

# Create directory
mkdir -p "$SKILLS_DIR"

# Copy all skills (except this script and README)
for dir in */; do
  if [ -d "$dir" ] && [ "$dir" != ".cursor/" ]; then
    cp -r "$dir" "$SKILLS_DIR/"
    echo "  ✅ Installed: $dir"
  fi
done

echo ""
echo "✅ Skills installed!"
echo ""
echo "Installed skills:"
ls -1 "$SKILLS_DIR"

echo ""
echo "🎉 Done! Your AI assistant can now use these skills."
