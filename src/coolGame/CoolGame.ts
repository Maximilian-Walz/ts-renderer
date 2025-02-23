import { GltfImporter } from '../engine/assets/GltfImporter'
import { Game } from '../engine/Game'

const gameScenes = {
  shadowTest: 'assets/gltf/shadowTest.glb',
  sponza: 'assets/gltf/sponza.glb',
}

export class CoolGame extends Game {
  protected async afterInit(): Promise<void> {
    await Promise.all(
      Object.entries(gameScenes).map(async (gameScene) => {
        const importer = new GltfImporter(this.engine.assetManager, this.engine.sceneManager, gameScene[0], gameScene[1])
        await importer.importGltf()
      })
    )

    this.engine.sceneManager.setActiveScene('shadowTest_scene_0')
    this.engine.setActiveCamera('Camera')
    this.engine.updateActiveSceneRenderData()
  }
}
