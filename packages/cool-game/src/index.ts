import { Game, GltfImporter, ShadowMapComponent } from "@my/engine"

import shadowTestGlb from "../assets/gltf/shadowTest.glb"
import sponzaGlb from "../assets/gltf/Sponza.glb"

const gameScenes = {
  shadowTest: shadowTestGlb,
  sponza: sponzaGlb,
}

export function createGame(rootDiv: HTMLDivElement) {
  return new CoolGame(rootDiv)
}

export class CoolGame extends Game {
  protected async afterInit(): Promise<void> {
    await Promise.all(
      Object.entries(gameScenes).map(async (gameScene) => {
        const importer = new GltfImporter(
          this.engine.assetManager,
          this.engine.sceneManager,
          gameScene[0],
          gameScene[1]
        )
        await importer.importGltf()
      })
    )

    this.engine.sceneManager.setActiveScene("shadowTest_scene_0")
    this.engine.setActiveCamera("Camera")

    const activeScene = this.engine.sceneManager.getActiveScene()
    const sunLight = activeScene.getEntity("Light")
    sunLight.addComponent(ShadowMapComponent, { size: 2048 })
  }
}
