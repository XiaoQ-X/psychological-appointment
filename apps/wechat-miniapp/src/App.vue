<script>
import { getCurrentUser, getToken, updateCurrentUser } from "./api/auth";
import { checkCurrentPageAccess, installRouteGuard } from "./utils/auth-guard";

export default {
  onLaunch() {
    installRouteGuard();
    this.validateStoredSession();
  },
  onShow() {
    installRouteGuard();
    this.validateStoredSession();
  },
  methods: {
    async validateStoredSession() {
      setTimeout(() => {
        checkCurrentPageAccess();
      }, 80);

      if (!getToken()) return;

      try {
        const data = await getCurrentUser();
        updateCurrentUser(data);
        if (data.mustChangePassword || data.user?.mustChangePassword) {
          uni.reLaunch({ url: "/pages/change-password/change-password" });
          return;
        }
        setTimeout(() => {
          checkCurrentPageAccess({ silent: true });
        }, 0);
      } catch (error) {
        // 401 is handled by the shared request client.
      }
    }
  }
};
</script>

<style>
@import "./styles/prototype.css";
</style>
