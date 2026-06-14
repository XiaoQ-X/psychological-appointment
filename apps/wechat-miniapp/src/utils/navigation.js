const DEFAULT_STUDENT_HOME = "/pages/student/home"
const DEFAULT_COUNSELOR_HOME = "/pages/counselor/dashboard"

// The miniapp currently uses a custom bottom tabbar instead of a native pages.json tabBar.
const NATIVE_TAB_PAGES = new Set([])
const CUSTOM_PRIMARY_PAGES = new Set([
  "/pages/student/home",
  "/pages/student/counselors",
  "/pages/student/appointments",
  "/pages/student/articles",
  "/pages/student/profile",
  "/pages/counselor/dashboard",
  "/pages/counselor/appointments",
  "/pages/counselor/students",
  "/pages/counselor/profile",
])

function pathOnly(url = "") {
  return url.split("?")[0]
}

export function isNativeTabPage(url = "") {
  return NATIVE_TAB_PAGES.has(pathOnly(url))
}

export function isCustomPrimaryPage(url = "") {
  return CUSTOM_PRIMARY_PAGES.has(pathOnly(url))
}

export function replacePage(url) {
  if (!url) return
  if (isNativeTabPage(url)) {
    uni.switchTab({ url })
    return
  }
  uni.redirectTo({
    url,
    fail: () => {
      uni.reLaunch({ url })
    },
  })
}

export function goPage(url) {
  if (!url) return
  if (isNativeTabPage(url)) {
    uni.switchTab({ url })
    return
  }
  if (isCustomPrimaryPage(url)) {
    replacePage(url)
    return
  }
  uni.navigateTo({
    url,
    fail: () => {
      replacePage(url)
    },
  })
}

export function goPrimaryPage(url) {
  replacePage(url)
}

export function safeBack(fallbackUrl = DEFAULT_STUDENT_HOME) {
  const pages = typeof getCurrentPages === "function" ? getCurrentPages() : []
  if (pages && pages.length > 1) {
    uni.navigateBack({
      delta: 1,
      fail: () => {
        replacePage(fallbackUrl)
      },
    })
    return
  }
  replacePage(fallbackUrl)
}

export function safeBackStudent(fallbackUrl = DEFAULT_STUDENT_HOME) {
  safeBack(fallbackUrl)
}

export function safeBackCounselor(fallbackUrl = DEFAULT_COUNSELOR_HOME) {
  safeBack(fallbackUrl)
}
