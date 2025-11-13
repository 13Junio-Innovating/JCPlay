# Raspberry Pi Kiosk (Chromium) — JC Vision Play

Este guia configura um Raspberry Pi para abrir o Chromium em modo kiosk na URL do Player e manter o processo monitorado.

## Dispositivo
- Hostname: `CS-RSP-TERIVA`
- URL do Player: `https://jc-vision-play.vercel.app/player/c5dc8d9fef4bdf859b1a887e566f5c89`

## Pacotes necessários
```bash
sudo apt update
sudo apt install -y chromium-browser xserver-xorg x11-xserver-utils unclutter
```

## Definir hostname
```bash
sudo hostnamectl set-hostname CS-RSP-TERIVA
```

## Opção A — systemd (robusto e monitorado)
1. Copie `raspi/kiosk.service` para o Pi:
```bash
sudo cp /caminho/para/raspi/kiosk.service /etc/systemd/system/kiosk.service
sudo systemctl daemon-reload
sudo systemctl enable kiosk
sudo systemctl start kiosk
```
2. O serviço iniciará o Chromium em modo kiosk com recuperação automática.

## Opção B — LXDE Autostart (simples)
1. Edite o autostart:
```bash
sudo nano /etc/xdg/lxsession/LXDE-pi/autostart
```
2. Cole o conteúdo de `raspi/lxde-autostart`.
3. Reinicie: `sudo reboot`

## Rotação e resolução (opcional)
```bash
# Rotacionar para vertical
xrandr -o left

# Forçar 1080p60 (exemplo)
xrandr --output HDMI-1 --mode 1920x1080 --rate 60
```

## Flags de performance para YouTube
- `--autoplay-policy=no-user-gesture-required`
- `--enable-accelerated-video-decode`
- `--use-gl=egl`

## Troubleshooting
- Tela apagando: use `xset s off`, `xset -dpms`, `xset s noblank` (já incluído).
- Cursor visível: `unclutter` oculta o cursor.
- Se cair, `systemd` reinicia o Chromium automaticamente.

### Tela preta no Raspberry Pi 3

O Pi 3 pode apresentar tela preta com as flags padrão de aceleração. Use o service específico para Pi 3:

```bash
sudo cp /caminho/para/raspi/kiosk-pi3.service /etc/systemd/system/kiosk.service
sudo systemctl daemon-reload
sudo systemctl enable kiosk
sudo systemctl restart kiosk
```

Esse service usa renderização por software e desativa caminhos gráficos problemáticos:

- `--disable-gpu` e `--use-gl=swiftshader` para evitar problemas de EGL/KMS.
- `--disable-features=UseOzonePlatform,VaapiVideoDecoder` para remover VAAPI e Ozone.
- `--disable-accelerated-video-decode` para prevenir tela preta em vídeo.

Se ainda houver problemas, teste manualmente (dentro da sessão gráfica):

```bash
chromium-browser --temp-profile \
  --kiosk --incognito --noerrdialogs --disable-session-crashed-bubble \
  --disable-gpu --use-gl=swiftshader \
  --disable-features=UseOzonePlatform,VaapiVideoDecoder \
  --disable-accelerated-video-decode \
  "https://jc-vision-play.vercel.app/player/c5dc8d9fef4bdf859b1a887e566f5c89"
```

E ajuste `/boot/config.txt` para garantir HDMI estável:

```ini
hdmi_force_hotplug=1
hdmi_drive=2
hdmi_group=2
hdmi_mode=82   # 1080p60
disable_overscan=1
gpu_mem=128
# Se causar problemas, comente se estiver presente:
# dtoverlay=vc4-fkms-v3d
```

Por fim, limpe o perfil do Chromium se houver estado antigo:

```bash
rm -rf /home/pi/.kiosk-profile
mkdir -p /home/pi/.kiosk-profile
```

## Setup automatizado (Pi 4/5)

Para configurar o Raspberry Pi 4/5 com aceleração, use o script:

```bash
# Copie para o Pi (exemplo):
scp raspi/setup-pi4.sh pi@<IP_DO_PI>:/home/pi/

# Execute com permissões de superusuário:
sudo bash /home/pi/setup-pi4.sh --hostname CS-RSP-TERIVA \
  --url "https://jc-vision-play.vercel.app/player/c5dc8d9fef4bdf859b1a887e566f5c89"
```

O script irá:
- Instalar pacotes necessários e habilitar Desktop Autologin.
- Ajustar `/boot/config.txt` para HDMI estável e ativar `dtoverlay=vc4-kms-v3d`.
- Desativar screen blanking e ocultar cursor.
- Instalar e iniciar o serviço `kiosk` específico do Pi 4/5.

### Service Pi 4/5 manual

Se preferir configurar manualmente, copie:

```bash
sudo cp /caminho/para/raspi/kiosk-pi4.service /etc/systemd/system/kiosk.service
sudo systemctl daemon-reload
sudo systemctl enable kiosk
sudo systemctl restart kiosk
```

Flags principais usadas para Pi 4/5:
- `--enable-accelerated-video-decode`, `--ignore-gpu-blocklist`
- `--use-gl=egl`


## Setup automatizado (Pi 3)

Para automatizar toda a configuração do Raspberry Pi 3, use o script:

```bash
# Copie para o Pi (exemplo):
scp raspi/setup-pi3.sh pi@<IP_DO_PI>:/home/pi/

# Execute com permissões de superusuário:
sudo bash /home/pi/setup-pi3.sh --hostname CS-RSP-TERIVA \
  --url "https://jc-vision-play.vercel.app/player/c5dc8d9fef4bdf859b1a887e566f5c89"
```

O script irá:
- Instalar pacotes (`chromium-browser`, `xserver-xorg`, `x11-xserver-utils`, `unclutter`, `raspi-config`).
- Definir o hostname.
- Habilitar Desktop Autologin (para garantir que o X esteja ativo).
- Ajustar `/boot/config.txt` para HDMI estável e comentar `vc4-fkms-v3d` se presente.
- Desativar screen blanking e ocultar cursor no LXDE.
- Instalar e iniciar o serviço `kiosk` específico para Pi 3.