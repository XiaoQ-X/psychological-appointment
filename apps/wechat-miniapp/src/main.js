import { createSSRApp } from "vue";
import App from "./App.vue";
import { checkCurrentPageAccess, installRouteGuard } from "./utils/auth-guard";

export function createApp() {
  const app = createSSRApp(App);
  installRouteGuard();
  app.mixin({
    onShow() {
      installRouteGuard();
      setTimeout(() => {
        checkCurrentPageAccess();
      }, 0);
    }
  });
  return { app };
}
