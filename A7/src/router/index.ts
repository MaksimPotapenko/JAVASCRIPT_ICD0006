import { createRouter, createWebHistory } from "vue-router";

import { extractRoles, readStoredSession } from "@/services/session";
import HomeView from "@/views/HomeView.vue";
import LoginView from "@/views/LoginView.vue";
import OrganiserView from "@/views/OrganiserView.vue";
import RegisterView from "@/views/RegisterView.vue";
import ResultsView from "@/views/ResultsView.vue";
import TeamDetailView from "@/views/TeamDetailView.vue";
import EventView from "@/views/EventView.vue";

// The router owns the top-level page split between public, user, and organiser flows.
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "home", component: HomeView },
    { path: "/login", name: "login", component: LoginView, meta: { guestOnly: true } },
    { path: "/register", name: "register", component: RegisterView, meta: { guestOnly: true } },
    { path: "/events/:contestId", name: "event", component: EventView, props: true },
    { path: "/events/:contestId/results", name: "results", component: ResultsView, props: true },
    { path: "/events/:contestId/teams/:teamId", name: "team-detail", component: TeamDetailView, props: true },
    { path: "/organiser", name: "organiser", component: OrganiserView, meta: { requiresOrganiser: true } },
  ],
});

router.beforeEach((to) => {
  const session = readStoredSession();

  if (to.meta.guestOnly && session?.jwt) {
    // Logged-in users should not revisit login/register unless they sign out first.
    return { name: "home" };
  }

  if (to.meta.requiresOrganiser) {
    if (!session?.jwt) {
      // Preserve the attempted route so login can send the user back into the organiser area.
      return { name: "login", query: { next: to.fullPath } };
    }

    // Read organiser role claims directly from the JWT for simple client-side access control.
    if (!extractRoles(session.jwt).includes("organiser")) {
      // Non-organisers can still use the public and user flows, but not the organiser workspace.
      return { name: "home" };
    }
  }

  // Returning true allows the navigation to continue unchanged.
  return true;
});

export { router };
