import { vec3 } from 'wgpu-matrix'
import { CoolGame } from '../coolGame/CoolGame'
import { CameraComponent, CameraControllerComponent, CameraType, TransformComponent } from '../engine/components'
import { Game } from '../engine/Game'
import { Entity } from '../engine/scenes/Entity'
import { Scene, SceneId } from '../engine/scenes/Scene'

const staticTextures: { identifier: string; path: string }[] = [
  { identifier: 'lightbulb', path: '/assets/textures/lightbulb.png' },
  { identifier: 'sun', path: '/assets/textures/sun.png' },
  { identifier: 'camera', path: '/assets/textures/camera.png' },
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
  }

  public async loadGame(device: GPUDevice) {
    console.log('Loading Game')
    this.game = new CoolGame()
    this.game.init(device).then(() => console.log('Game loaded'))
  }

  public setEditorRenderTarget(canvas: HTMLCanvasElement) {
    this.engine.setRenderTarget(canvas)
  }

  public setGameRenderTarget(canvas: HTMLCanvasElement) {
    this.game.engine.setRenderTarget(canvas)
  }

  private addEditorCamera(scene: Scene) {
    let targetTransform = new TransformComponent()
    const editorCamId = 'editor-cam'
    const editorCam = scene.createEntity(editorCamId, TransformComponent.fromValues(vec3.fromValues(0, 0, 10), undefined, undefined, targetTransform))
    editorCam.addComponent(new CameraComponent(CameraType.PERSPECTIVE, { fov: 1, aspect: 1 }, 0.1, 100))
    editorCam.addComponent(new CameraControllerComponent())
    this.engine.setActiveCamera(editorCamId)
  }

  public loadGameScene(sceneId: SceneId) {
    if (!this.engine.sceneManager.hasScene(sceneId)) {
      const copy = this.engine.sceneManager.addSceneCopy(this.game.engine.sceneManager.getScene(sceneId))
      this.addEditorCamera(copy)
    }
    this.engine.sceneManager.setActiveScene(sceneId)
    this.engine.updateActiveSceneRenderData()
  }
}
