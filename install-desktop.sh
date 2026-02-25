#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# roni/install-desktop.sh
#
# Installs the Roni desktop entry and icon so the OS taskbar/app switcher
# shows "Roni" with the Roni icon instead of Chromium.
#
# Run once on the host during development, or as part of Roni OS setup.
# Usage:
#   chmod +x install-desktop.sh
#   ./install-desktop.sh            # installs for current user
#   sudo ./install-desktop.sh       # installs system-wide
# ─────────────────────────────────────────────────────────────────────────────

set -e

RONI_ROOT="$(cd "$(dirname "$0")" && pwd)"
ICON_SRC="$RONI_ROOT/assets/roni.svg"

# ── Determine install scope ───────────────────────────────────────────────────

if [ "$EUID" -eq 0 ]; then
  DESKTOP_DIR="/usr/share/applications"
  ICON_DIR="/usr/share/icons/hicolor/scalable/apps"
  SCOPE="system-wide"
else
  DESKTOP_DIR="$HOME/.local/share/applications"
  ICON_DIR="$HOME/.local/share/icons/hicolor/scalable/apps"
  SCOPE="user (~/.local)"
fi

echo "Installing Roni desktop entry ($SCOPE)..."

# ── Icon ─────────────────────────────────────────────────────────────────────

mkdir -p "$ICON_DIR"

if [ -f "$ICON_SRC" ]; then
  cp "$ICON_SRC" "$ICON_DIR/roni.svg"
  echo "  ✓ Icon installed: $ICON_DIR/roni.svg"
else
  echo "  ⚠ No icon found at $ICON_SRC"
  echo "    Place your roni.svg at assets/roni.svg and re-run."
  echo "    Continuing without icon..."
fi

# Update icon cache (GNOME/GTK)
if command -v gtk-update-icon-cache &>/dev/null; then
  if [ "$EUID" -eq 0 ]; then
    gtk-update-icon-cache -f -t /usr/share/icons/hicolor 2>/dev/null || true
  fi
  echo "  ✓ Icon cache updated"
fi

# ── Desktop entry ─────────────────────────────────────────────────────────────

mkdir -p "$DESKTOP_DIR"

# Write the desktop file with the actual Roni root path baked in
cat > "$DESKTOP_DIR/Roni.desktop" << DESKTOP
[Desktop Entry]
Type=Application
Version=1.0
Name=Roni
GenericName=Roni OS
Comment=Roni Operating System
Icon=roni
Exec=node $RONI_ROOT/kernel/boot.js
Path=$RONI_ROOT
Terminal=false
Categories=System;
StartupWMClass=Roni
StartupNotify=false
DESKTOP

chmod +x "$DESKTOP_DIR/Roni.desktop"
echo "  ✓ Desktop entry installed: $DESKTOP_DIR/Roni.desktop"

# ── Validate desktop-file-utils if available ──────────────────────────────────

if command -v desktop-file-validate &>/dev/null; then
  if desktop-file-validate "$DESKTOP_DIR/Roni.desktop" 2>/dev/null; then
    echo "  ✓ Desktop entry is valid"
  else
    echo "  ⚠ Desktop entry validation warning (non-fatal)"
  fi
fi

# ── Update desktop database ───────────────────────────────────────────────────

if command -v update-desktop-database &>/dev/null; then
  update-desktop-database "$DESKTOP_DIR" 2>/dev/null || true
  echo "  ✓ Desktop database updated"
fi

echo ""
echo "Done. Roni will appear as 'Roni' in your taskbar and app switcher."
echo "You may need to log out and back in for icon changes to take effect."
echo ""
echo "To uninstall:"
echo "  rm $DESKTOP_DIR/Roni.desktop"
echo "  rm $ICON_DIR/roni.svg"