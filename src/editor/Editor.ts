import { vec3 } from 'wgpu-matrix'
import { CoolGame } from '../coolGame/CoolGame'
import {
  BillboardComponent,
  BillboardProps,
  CameraComponent,
  CameraProps,
  CameraType,
  ComponentType,
  LightComponent,
  LightType,
  ScriptComponent,
  TransformComponent,
  TransformProps,
} from '../engine/components'
import { Game } from '../engine/Game'
import { Entity } from '../engine/scenes/Entity'
import { Scene, SceneId } from '../engine/scenes/Scene'
import { CameraControllerScript } from './scripts/CameraControllerScript'

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
    const transformProps: TransformProps = {
      name: 'Editor Cam',
      position: vec3.fromValues(0, 0, 10),
      parentTransform: undefined,
    }

    const cameraProps: CameraProps = {
      cameraType: CameraType.PERSPECTIVE,
      projectionData: {
        fov: 1,
        aspect: 1,
      },
      zNear: 0.1,
      zFar: 100,
    }

    const editorCamId = 'editor-cam'
    const editorCam = scene.createEntity(editorCamId, transformProps)
    editorCam.addComponent(CameraComponent, cameraProps)
    editorCam.addComponent(ScriptComponent, { CameraControllerScript })
    this.engine.setActiveCamera(editorCamId)
  }

  private addBillboards(scene: Scene) {
    scene.getComponents([ComponentType.TRANSFORM, ComponentType.CAMERA]).forEach(({ transform }) => {
      const billboard = scene.createEntity(`camera_${(transform as TransformComponent).name}_billboard`, { parentTransform: transform as TransformComponent } as TransformProps)
      billboard.addComponent(BillboardComponent, { textureLoader: this.engine.assetManager.getTextureLoader('camera') } as BillboardProps)
    })

    scene.getComponents([ComponentType.TRANSFORM, ComponentType.LIGHT]).forEach(({ transform, light }) => {
      const billboard = scene.createEntity(`light_${(transform as TransformComponent).name}_billboard`, { parentTransform: transform as TransformComponent } as TransformProps)
      billboard.addComponent(BillboardComponent, {
        textureLoader: this.engine.assetManager.getTextureLoader((light as LightComponent).lightType == LightType.SUN ? 'sun' : 'lightbulb'),
      } as BillboardProps)
    })
  }

  public loadGameScene(sceneId: SceneId) {
    if (!this.engine.sceneManager.hasScene(sceneId)) {
      const copy = this.engine.sceneManager.addSceneCopy(this.game.engine.sceneManager.getScene(sceneId))
      this.addEditorCamera(copy)
      this.addBillboards(copy)
    }
    this.engine.sceneManager.setActiveScene(sceneId)
  }
}
