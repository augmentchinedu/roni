import { spawn } from "node:child_process";
import { platform } from "node:process";

export function createTray({ onShow, onHide, onExit }) {
  if (platform === "win32") return createWindowsTray({ onShow, onHide, onExit });
  if (platform === "darwin") return createMacTray({ onShow, onHide, onExit });
  return createLinuxTray({ onShow, onHide, onExit });
}

/* ───────────────────────── WINDOWS ───────────────────────── */

function createWindowsTray(handlers) {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$icon = New-Object System.Windows.Forms.NotifyIcon
$icon.Icon = [System.Drawing.SystemIcons]::Application
$icon.Visible = $true
$icon.Text = "Roni OS"

$menu = New-Object System.Windows.Forms.ContextMenuStrip

$show = $menu.Items.Add("Show")
$hide = $menu.Items.Add("Hide")
$exit = $menu.Items.Add("Exit")

$show.add_Click({ Write-Output "show" })
$hide.add_Click({ Write-Output "hide" })
$exit.add_Click({ Write-Output "exit"; $icon.Dispose(); exit })

$icon.ContextMenuStrip = $menu

while ($true) { Start-Sleep -Seconds 1 }
`;

  const ps = spawn("powershell.exe", ["-NoProfile", "-Command", script], {
    stdio: ["ignore", "pipe", "ignore"],
    windowsHide: true,
  });

  ps.stdout.on("data", (buf) => {
    const msg = buf.toString().trim();
    if (msg === "show") handlers.onShow();
    if (msg === "hide") handlers.onHide();
    if (msg === "exit") handlers.onExit();
  });

  return ps;
}

/* ───────────────────────── macOS ───────────────────────── */

function createMacTray(handlers) {
  const script = `
on run
  display dialog "Roni is running in background." buttons {"Show","Hide","Exit"} default button "Show"
end run
`;

  const proc = spawn("osascript", ["-e", script], {
    stdio: ["ignore", "pipe", "ignore"],
  });

  proc.stdout.on("data", (buf) => {
    const msg = buf.toString();
    if (msg.includes("Show")) handlers.onShow();
    if (msg.includes("Hide")) handlers.onHide();
    if (msg.includes("Exit")) handlers.onExit();
  });

  return proc;
}

/* ───────────────────────── Linux ───────────────────────── */

function createLinuxTray(handlers) {
  const proc = spawn("zenity", [
    "--question",
    "--text=Roni is running",
    "--ok-label=Show",
    "--cancel-label=Exit",
  ]);

  proc.on("exit", (code) => {
    if (code === 0) handlers.onShow();
    else handlers.onExit();
  });

  return proc;
}