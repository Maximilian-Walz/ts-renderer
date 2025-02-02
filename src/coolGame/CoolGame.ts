import { GltfImporter } from '../engine/assets/GltfImporter'
import { Game } from '../engine/Game'

export class CoolGame extends Game {
  protected async afterInit(): Promise<void> {
    const path = 'assets/gltf/shadowTest.glb'
    const identifier = 'shadow-test'
    const sceneId = identifier + '_scene_0'

    const importer = new GltfImporter(this.engine.assetManager, this.engine.sceneManager, identifier, path)
    await importer.importGltf()
    this.engine.sceneManager.setActiveScene(sceneId)
    this.engine.setActiveCamera('Camera')
    this.engine.updateActiveSceneRenderData()
  }
}
