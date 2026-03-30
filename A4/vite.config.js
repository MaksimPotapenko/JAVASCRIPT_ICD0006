import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
export default defineConfig({
    base: "/a4/",
    plugins: [vue()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
