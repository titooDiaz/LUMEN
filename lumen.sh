#!/usr/bin/env bash
# LUMEN — Modern LaTeX Desktop Editor Launcher for Linux (Ubuntu & Linux Mint)

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Ensure ~/.local/bin is in PATH for tectonic
if [ -d "$HOME/.local/bin" ]; then
  export PATH="$HOME/.local/bin:$PATH"
fi

echo "=========================================="
echo "  LUMEN — Modern LaTeX Desktop Editor"
echo "  Optimized for Ubuntu and Linux Mint"
echo "=========================================="

case "$1" in
  --web|--preview)
    echo "Iniciando previsualización web en puerto 5173..."
    npx vite preview --port 5173 --host
    ;;
  --dev)
    echo "Iniciando entorno de desarrollo con Hot-Reload..."
    npm run dev
    ;;
  --build)
    echo "Compilando aplicación e instaladores Linux (.deb y .AppImage)..."
    npm run build
    ;;
  *)
    if [ -f "./node_modules/electron/dist/electron" ]; then
      echo "Iniciando aplicación de escritorio LUMEN..."
      ./node_modules/.bin/electron .
    else
      echo "Lanzando LUMEN en el entorno local..."
      npx vite preview --port 5173 --host
    fi
    ;;
esac
