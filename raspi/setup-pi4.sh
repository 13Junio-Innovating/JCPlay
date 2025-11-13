#!/usr/bin/env bash
set -euo pipefail

# JC Vision Play — Setup automatizado para Raspberry Pi 4/5 (Chromium Kiosk)
# Este script prepara o Pi 4/5 para rodar o Chromium em modo kiosk com aceleração.
# Uso:
#   sudo bash setup-pi4.sh [--hostname <NOME>] [--url "<PLAYER_URL>"]
# Padrões: hostname CS-RSP-TERIVA; URL do repositório.

HOSTNAME="CS-RSP-TERIVA"
URL_DEFAULT="https://jc-vision-play.vercel.app/player/c5dc8d9fef4bdf859b1a887e566f5c89"
URL="$URL_DEFAULT"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --hostname)
      HOSTNAME="$2"; shift 2;;
    --url)
      URL="$2"; shift 2;;
    *)
      echo "Parâmetro desconhecido: $1"; exit 1;;
  esac
done

echo "==> Hostname: $HOSTNAME"
echo "==> URL: $URL"

echo "==> Instalando pacotes..."
apt update
apt install -y chromium-browser xserver-xorg x11-xserver-utils unclutter raspi-config

echo "==> Definindo hostname..."
hostnamectl set-hostname "$HOSTNAME"

echo "==> Habilitando desktop com autologin..."
if command -v raspi-config >/dev/null 2>&1; then
  raspi-config nonint do_boot_behaviour B4 || true
fi

echo "==> Preparando perfil dedicado do Chromium..."
/bin/mkdir -p /home/pi/.kiosk-profile
/bin/chown -R pi:pi /home/pi/.kiosk-profile

echo "==> Ajustando /boot/config.txt para aceleração e HDMI (backup criado)..."
cp /boot/config.txt "/boot/config.txt.bak.$(date +%Y%m%d%H%M%S)"

ensure_line() {
  local key="$1"; shift
  local value="$*"
  if ! grep -q "^${key}=" /boot/config.txt; then
    echo "${key}=${value}" >> /boot/config.txt
  else
    sed -i "s/^${key}=.*/${key}=${value}/" /boot/config.txt
  fi
}

# HDMI estável e memória GPU
ensure_line hdmi_force_hotplug 1
ensure_line hdmi_drive 2
ensure_line hdmi_group 2
ensure_line hdmi_mode 82
ensure_line disable_overscan 1
ensure_line gpu_mem 128

# Ativar overlay de aceleração (KMS) — substituir fkms por kms se necessário
if grep -q '^dtoverlay=vc4-fkms-v3d' /boot/config.txt; then
  sed -i 's/^dtoverlay=vc4-fkms-v3d/dtoverlay=vc4-kms-v3d/' /boot/config.txt
elif grep -q '^#\s*dtoverlay=vc4-kms-v3d' /boot/config.txt; then
  sed -i 's/^#\s*dtoverlay=vc4-kms-v3d/dtoverlay=vc4-kms-v3d/' /boot/config.txt
elif ! grep -q '^dtoverlay=vc4-kms-v3d' /boot/config.txt; then
  echo 'dtoverlay=vc4-kms-v3d' >> /boot/config.txt
fi

echo "==> Desativando screen blanking e ocultando cursor no LXDE..."
AUTOSTART="/etc/xdg/lxsession/LXDE-pi/autostart"
mkdir -p "$(dirname "$AUTOSTART")"
touch "$AUTOSTART"
append_once() { grep -qxF "$1" "$AUTOSTART" || echo "$1" >> "$AUTOSTART"; }
append_once "@xset s off"
append_once "@xset -dpms"
append_once "@xset s noblank"
append_once "@unclutter -idle 0"

echo "==> Instalando serviço kiosk (Pi 4/5) em /etc/systemd/system/kiosk.service..."
SERVICE_PATH="/etc/systemd/system/kiosk.service"

if [[ -f "kiosk-pi4.service" ]]; then
  cp -f "kiosk-pi4.service" "$SERVICE_PATH"
  sed -i "s~\"https://jc-vision-play.vercel.app/player/c5dc8d9fef4bdf859b1a887e566f5c89\"~\"$URL\"~" "$SERVICE_PATH"
else
  cat > "$SERVICE_PATH" <<EOF
[Unit]
Description=Chromium Kiosk (Pi 4/5) - JC Vision Play
After=systemd-user-sessions.service display-manager.service
Wants=graphical.target

[Service]
User=pi
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/pi/.Xauthority
Type=simple
Restart=always
RestartSec=3

ExecStart=/usr/bin/chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-session-crashed-bubble \
  --incognito \
  --autoplay-policy=no-user-gesture-required \
  --user-data-dir=/home/pi/.kiosk-profile \
  --enable-accelerated-video-decode \
  --ignore-gpu-blocklist \
  --use-gl=egl \
  --start-maximized \
  "$URL"

[Install]
WantedBy=graphical.target
EOF
fi

echo "==> Habilitando e iniciando serviço kiosk..."
systemctl daemon-reload
systemctl enable kiosk
systemctl restart kiosk || true

echo "==> Concluído. Reinicie para aplicar overlay KMS: sudo reboot"
echo "==> Logs: journalctl -u kiosk -b -f"