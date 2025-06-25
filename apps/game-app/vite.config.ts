import tailwindcss from "@tailwindcss/vite"
import path from "path"
import { defineConfig } from "vite"
import glsl from "vite-plugin-glsl"

export default defineConfig(() => {
  const gameModule = process.env.VITE_GAME_ENTRY
  if (!gameModule) {
    throw new Error("Missing VITE_GAME_ENTRY")
  }

  console.log("Using game entry:", path.resolve(__dirname, "../../packages/", gameModule))

  return {
    plugins: [glsl(), tailwindcss()],
    root: __dirname,
    assetsInclude: ["**/*.glb"],
    resolve: {
      alias: {
        "@my/engine": path.resolve(__dirname, "../../packages/engine/src"),
        "@my/cool-game": path.resolve(__dirname, "../../packages/cool-game/src"),
        "@game-entry": path.resolve(__dirname, "../../packages/", gameModule),
      },
    },
  }
})
