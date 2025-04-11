import { quat, vec3 } from 'wgpu-matrix'
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
  ScriptProps,
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
    const editorCamTarget = scene.createEntity('editor-cam-target', { position: vec3.zero(), rotation: quat.identity(), scale: vec3.fromValues(1, 1, 1) })

    const transformProps: TransformProps = {
      position: vec3.fromValues(0, 0, 10),
      rotation: quat.identity(),
      scale: vec3.fromValues(1, 1, 1),
      parent: editorCamTarget.getComponent(TransformComponent), // TODO: Previously this was just another transform component, however now they dont exist without an corresponding entity. Think about how this should be done now
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

    const editorCam = scene.createEntity('edior-cam', transformProps)
    editorCam.addComponent(CameraComponent, cameraProps)
    editorCam.addComponent(ScriptComponent, {
      scripts: [{ scriptType: CameraControllerScript }],
    } as ScriptProps)

    this.engine.setActiveCamera(editorCam.entityId)
  }

  private addBillboards(scene: Scene) {
    const defaultTransformProps = {
      position: vec3.zero(),
      rotation: quat.identity(),
      scale: vec3.fromValues(1, 1, 1),
    } as TransformProps

    scene.getComponents([ComponentType.TRANSFORM, ComponentType.CAMERA]).forEach(({ transform }) => {
      const billboard = scene.createEntity(`camera_${(transform as TransformComponent).entity.entityId}_billboard`, defaultTransformProps)
      billboard.addComponent(BillboardComponent, { textureLoader: this.engine.assetManager.getTextureLoader('camera') } as BillboardProps)
    })

    scene.getComponents([ComponentType.TRANSFORM, ComponentType.LIGHT]).forEach(({ transform, light }) => {
      const billboard = scene.createEntity(`light_${(transform as TransformComponent).entity.entityId}_billboard`, defaultTransformProps)
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
