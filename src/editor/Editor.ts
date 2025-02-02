import { vec3 } from 'wgpu-matrix'
import { CoolGame } from '../coolGame/CoolGame'
import { GltfImporter } from '../engine/assets/GltfImporter'
import { CameraComponent, CameraControllerComponent, CameraType, TransformComponent } from '../engine/components'
import { Game } from '../engine/Game'
import { Scene } from '../engine/scenes/Scene'

const staticTextures: { identifier: string; path: string }[] = [
  { identifier: 'lightbulb', path: '/assets/textures/lightbulb.png' },
  { identifier: 'sun', path: '/assets/textures/sun.png' },
  { identifier: 'camera', path: '/assets/textures/camera.png' },
]

const gltfs: { identifier: string; path: string }[] = [
  { identifier: 'Shadow Test', path: 'assets/gltf/shadowTest.glb' },
  //{ identifier: 'Sponza', path: '/assets/gltf/Sponza.glb' },
  //{ identifier: 'Water Bottle', path: '/assets/gltf/WaterBottle.glb' },
  //{ identifier: 'BoomBox', path: '/assets/gltf/BoomBox.glb' },
  //{ identifier: 'DamagedHelmet', path: '/assets/gltf/DamagedHelmet.glb' },
]

export class Editor extends Game {
  private game!: Game

  activeCameraEntityId: number | undefined

  protected async afterInit() {
    await Promise.all(
      staticTextures.map(async ({ identifier, path }) => {
        await this.engine.assetManager.addTextureFromPath(identifier, path, identifier)
      })
    )

    this.engine.sceneManager.addScene('editor', new Scene('editor'))
    this.engine.sceneManager.setActiveScene('editor')
    this.addEditorCamera()
    this.engine.updateActiveSceneRenderData()
  }

  public async loadGame(device: GPUDevice) {
    this.game = new CoolGame()
    await this.game.init(device)

    await Promise.all(
      gltfs.map(async ({ identifier, path }) => {
        const importer = new GltfImporter(this.game.engine.assetManager, this.game.engine.sceneManager, identifier, path)
        await importer.importGltf()
      })
    )

    const gameScene = this.game.engine.sceneManager.getScene('shadow-test_scene_0')
    this.engine.sceneManager.addScene('game-scene', gameScene)
    this.engine.sceneManager.instanceScene('game-scene')
  }

  public setEditorRenderTarget(canvas: HTMLCanvasElement) {
    this.engine.setRenderTarget(canvas)
  }

  public setGameRenderTarget(canvas: HTMLCanvasElement) {
    this.game.engine.setRenderTarget(canvas)
  }

  private addEditorCamera() {
    let targetTransform = new TransformComponent()
    const editorCamId = 'editor-cam'
    this.engine.sceneManager.createEntity(editorCamId, TransformComponent.fromValues(vec3.fromValues(0, 0, 10), undefined, undefined, targetTransform))
    this.engine.sceneManager.addComponentToEntity(editorCamId, new CameraComponent(CameraType.PERSPECTIVE, { fov: 1, aspect: 1 }, 0.1, 100))
    this.engine.sceneManager.addComponentToEntity(editorCamId, new CameraControllerComponent())
    this.engine.setActiveCamera(editorCamId)
  }
}
