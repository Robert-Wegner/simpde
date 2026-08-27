import {sites} from "@openai/sites-vite-plugin";
import {defineConfig} from "vite";
import vinext from "vinext";

export default defineConfig(async () => {
    const {cloudflare} = await import("@cloudflare/vite-plugin");

    return {
        plugins: [
            vinext(),
            sites(),
            cloudflare({
                viteEnvironment: {name: "rsc", childEnvironments: ["ssr"]},
                config: {
                    main: "vinext/server/app-router-entry",
                    compatibility_flags: ["nodejs_compat"],
                },
            }),
        ],
    };
});
