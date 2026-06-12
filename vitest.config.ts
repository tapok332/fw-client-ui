import {defineConfig} from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
    plugins: [react()],
    test: {
        environment: "jsdom",
        environmentOptions: {
            jsdom: {
                url: "http://localhost/",
            },
        },
        globals: true,
        setupFiles: ["./vitest.setup.ts"],
        css: false,
    },
    resolve: {
        alias: {"@": path.resolve(__dirname, "./src")},
    },
});
