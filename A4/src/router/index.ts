import { createRouter, createWebHistory } from "vue-router";

import DashboardView from "@/views/DashboardView.vue";
import LoginView from "@/views/LoginView.vue";
import RegisterView from "@/views/RegisterView.vue";
import { readStoredSession } from "@/services/session";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/app" },
    { path: "/login", name: "login", component: LoginView, meta: { guestOnly: true } },
    { path: "/register", name: "register", component: RegisterView, meta: { guestOnly: true } },
    { path: "/app", name: "dashboard", component: DashboardView, meta: { requiresAuth: true } },
  ],
});

// Protects the dashboard from guests and redirects authenticated users away from guest-only routes.
router.beforeEach((to) => {
  const hasSession = Boolean(readStoredSession()?.token);

  if (to.meta.requiresAuth && !hasSession) {
    return { name: "login" };
  }

  if (to.meta.guestOnly && hasSession) {
    return { name: "dashboard" };
  }

  return true;
});

export { router };
