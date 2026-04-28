import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import { router } from "./router";
import "./styles.css";

/**
 * Creates the root Vue application instance before plugins are attached.
 */
const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount("#app");
