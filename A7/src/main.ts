import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import { router } from "./router";
import "./styles.css";
import { useAuthStore } from "./stores/auth";

/**
 * Creates the root Vue application instance before plugins are attached.
 */
const app = createApp(App);
const pinia = createPinia();

// Pinia must be installed before stores are accessed anywhere in the component tree.
app.use(pinia);
// Router is attached once so every page can use declarative navigation and route params.
app.use(router);

// Rehydrate the auth store on boot so page refreshes keep the user logged in when tokens exist.
useAuthStore(pinia).hydrate();
app.mount("#app");
