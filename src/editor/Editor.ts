import { vec3 } from 'wgpu-matrix'
import { CoolGame } from '../coolGame/CoolGame'
import { CameraComponent, CameraControllerComponent, CameraType, TransformComponent } from '../engine/components'
import { Game } from '../engine/Game'
import { Entity } from '../engine/scenes/Entity'
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
  public game!: Game

  public activeCameraEntityId: number | undefined
  public activeEntity: Entity | undefined

  protected async afterInit() {
    await Promise.all(
      staticTextures.map(async ({ identifier, path }) => {
        await this.engine.assetManager.addTextureFromPath(identifier, path, identifier)
      })
    )

    this.engine.sceneManager.addScene(new Scene('editor', 'Editor'))
    this.engine.sceneManager.setActiveScene('editor')
    this.addEditorCamera()
    this.engine.updateActiveSceneRenderData()
  }

  public async loadGame(device: GPUDevice) {
    this.game = new CoolGame()
    await this.game.init(device)

    const gameScene = this.game.engine.sceneManager.getActiveScene()
    this.engine.sceneManager.instanceScene(gameScene)
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
    const activeScene = this.engine.sceneManager.getActiveScene()
    const editorCam = activeScene.createEntity(editorCamId, TransformComponent.fromValues(vec3.fromValues(0, 0, 10), undefined, undefined, targetTransform))
    editorCam.addComponent(new CameraComponent(CameraType.PERSPECTIVE, { fov: 1, aspect: 1 }, 0.1, 100))
    editorCam.addComponent(new CameraControllerComponent())
    this.engine.setActiveCamera(editorCamId)
  }
}
