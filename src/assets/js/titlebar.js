const { getCurrentWindow } = window.__TAURI__.window;

const appWindow = getCurrentWindow();

document
  .querySelector(".app-min")
  ?.addEventListener('click', () => appWindow.minimize());
document
  .querySelector(".app-close")
  ?.addEventListener('click', () => appWindow.close());