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

app.use(pinia);
app.use(router);

useAuthStore(pinia).hydrate();
app.mount("#app");
