import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import { router } from "./router";
import "./styles.css";

// Bootstraps the Vue app, then attaches Pinia and Router before mounting into the root DOM node.
const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount("#app");
