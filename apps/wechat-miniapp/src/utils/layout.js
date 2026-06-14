const DEFAULT_STATUS_BAR_HEIGHT = 25;
const DEFAULT_NAV_BAR_HEIGHT = 44;

function safeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
}

export function getLayoutVars() {
  let systemInfo = {};
  let menuButton = null;

  try {
    systemInfo = uni.getSystemInfoSync ? uni.getSystemInfoSync() : {};
  } catch (error) {
    systemInfo = {};
  }

  // #ifdef MP-WEIXIN
  try {
    menuButton = uni.getMenuButtonBoundingClientRect ? uni.getMenuButtonBoundingClientRect() : null;
  } catch (error) {
    menuButton = null;
  }
  // #endif

  const statusBarHeight = safeNumber(systemInfo.statusBarHeight, DEFAULT_STATUS_BAR_HEIGHT);
  const capsuleTop = safeNumber(menuButton?.top, statusBarHeight);
  const capsuleHeight = safeNumber(menuButton?.height, 32);
  const capsuleBottom = safeNumber(menuButton?.bottom, capsuleTop + capsuleHeight);
  const navBarHeight = Math.max(
    DEFAULT_NAV_BAR_HEIGHT,
    capsuleBottom + Math.max(0, capsuleTop - statusBarHeight) - statusBarHeight
  );

  return {
    "--status-bar-height": `${statusBarHeight}px`,
    "--capsule-top": `${capsuleTop}px`,
    "--capsule-height": `${capsuleHeight}px`,
    "--capsule-bottom": `${capsuleBottom}px`,
    "--custom-nav-height": `${navBarHeight}px`
  };
}
