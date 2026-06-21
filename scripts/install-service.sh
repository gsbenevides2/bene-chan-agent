#!/bin/sh
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVICE_NAME="bene-chan-agent"
SERVICE_FILE="$HOME/.config/systemd/user/${SERVICE_NAME}.service"

echo "==> Installing dependencies..."
bun install --frozen-lockfile --cwd "$PROJECT_DIR"

echo "Sync Database"
bun run db:sync

echo "==> Building project..."
bun run --cwd "$PROJECT_DIR" build

echo "==> Preparing standalone output..."
cd "$PROJECT_DIR"
cp -r public .next/standalone
cp -r .next/static .next/standalone/.next

echo "==> Creating systemd user service..."
mkdir -p "$HOME/.config/systemd/user"

cat > "$SERVICE_FILE" << SERVICEEOF
[Unit]
Description=Bene-chan Agent - Personal AI Assistant
Documentation=https://github.com/gsbenevides2/bene-chan-agent
After=network.target

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR/.next/standalone
ExecStart=$(which bun) run --env-file=$PROJECT_DIR/.env server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=default.target
SERVICEEOF

echo "==> Reloading systemd user daemon..."
systemctl --user daemon-reload

echo "==> Enabling and starting service..."
systemctl --user enable "$SERVICE_NAME"
systemctl --user start "$SERVICE_NAME"

echo "==> Service status:"
systemctl --user status "$SERVICE_NAME" --no-pager

echo ""
echo "Done! Service '$SERVICE_NAME' installed and running."
echo "Logs: journalctl --user -u $SERVICE_NAME -f"
