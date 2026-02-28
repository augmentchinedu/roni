/**
 * kernel/tray.js
 */

import SysTray from "systray2";
import { resolve } from "node:path";

export function createTray({ onShow, onHide, onExit }) {
  const iconPath =
    process.platform === "win32"
      ? resolve("assets/tray.ico")
      : resolve("assets/tray.png");

  const tray = new SysTray({
    menu: {
      icon: iconPath,
      title: "Roni",
      tooltip: "Roni OS",
      items: [
        {
          title: "Show",
          tooltip: "Show Roni",
          enabled: true,
        },
        {
          title: "Hide",
          tooltip: "Hide Roni",
          enabled: true,
        },
        {
          title: "Exit",
          tooltip: "Exit Roni",
          enabled: true,
        },
      ],
    },
    debug: false,
  });

  tray.onClick((action) => {
    const label = action.item.title;

    if (label === "Show") onShow();
    if (label === "Hide") onHide();
    if (label === "Exit") onExit();
  });

  return tray;
}
