import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        environment: "node",
        setupFiles: ["tests/setup/zotero-globals.ts"],
        include: ["tests/**/*.test.ts"],
        typecheck: {
            tsconfig: "./tsconfig.test.json",
        },
    },
})
