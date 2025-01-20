import Stats from 'stats.js'
import { quat, vec3 } from 'wgpu-matrix'
import { GltfAssetManager } from './assets/GltfAssetManager'
import { StaticAssetManager } from './assets/StaticAssetsManager'
import {
  AutoRotateComponent,
  CameraComponent,
  CameraControllerComponent,
  ComponentType,
  LightComponent,
  LightType,
  MeshRendererComponent,
  TransformComponent,
} from './components/components'
import { EntityComponentSystem, EntityId, SimpleEcs } from './entity-component-system'
import { InputManager } from './InputManager'
import { CameraController } from './systems/CameraController'
import { Renderer, SceneData } from './systems/Renderer'
import { Rotator } from './systems/Rotator'
export type Scene = {
  name?: string
  source: string
}

export class Engine {
  public ecs: EntityComponentSystem

  private inputManager: InputManager
  private assetManager: GltfAssetManager
  private staticAssetManager: StaticAssetManager
  private renderer: Renderer
  private rotator: Rotator
  private cameraController: CameraController
  private stats: Stats = new Stats()

  private activeCameraId?: EntityId

  constructor() {
    this.ecs = new SimpleEcs()
    this.inputManager = new InputManager()
    this.assetManager = new GltfAssetManager(this.ecs)
    this.staticAssetManager = new StaticAssetManager()

    // Systems
    this.renderer = new Renderer()
    this.rotator = new Rotator()
    this.cameraController = new CameraController(this.inputManager)
  }

  async init() {
    await this.renderer.init(this.assetManager, this.staticAssetManager)
  }

  setRenderTarget(canvas: HTMLCanvasElement) {
    this.renderer.setRenderTarget(canvas)
    this.inputManager.setTarget(canvas)
    this.initRendering()
  }

  setActiveCamera(cameraId: EntityId) {
    this.activeCameraId = cameraId
  }

  private initRendering() {
    this.stats.showPanel(0)
    this.stats.dom.style.position = 'absolute'
    this.stats.dom.style.bottom = '0px'
    this.stats.dom.style.top = 'auto'
    document.body.appendChild(this.stats.dom)

    requestAnimationFrame(() => this.loop())
  }

  private getSceneData(): SceneData {
    const models = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as [TransformComponent, MeshRendererComponent][]
    const lights = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.LIGHT]) as [TransformComponent, LightComponent][]
    const cameras = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.CAMERA]) as [TransformComponent, CameraComponent][]

    const activeCamera = this.activeCameraId ? (this.ecs.getComponentsByEntityId(this.activeCameraId) as [TransformComponent, CameraComponent]) : undefined

    return {
      modelsData: models.map((model) => {
        return { transform: model[0], meshRenderer: model[1] }
      }),
      lightsData: lights.map((light) => {
        return { transform: light[0], light: light[1] }
      }),
      camerasData: cameras.map((camera) => {
        return { transform: camera[0], camera: camera[1] }
      }),
      activeCameraData: activeCamera ? { transform: activeCamera[0], camera: activeCamera[1] } : undefined,
    }
  }

  private loop() {
    this.stats.begin()

    const rotatableModels = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.AUTO_ROTATE]) as [TransformComponent, AutoRotateComponent][]
    this.rotator.rotate(rotatableModels)

    const controlledEntities = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.CAMERA_CONTROLLER]) as [TransformComponent, CameraControllerComponent][]
    this.cameraController.update(
      controlledEntities.map((controlledEntity) => {
        return { transform: controlledEntity[0], controller: controlledEntity[1] }
      })
    )

    this.renderer.render(this.getSceneData())

    this.inputManager.clearDeltas()
    this.stats.end()
    requestAnimationFrame(() => this.loop())
  }

  async loadScene(source: string) {
    this.activeCameraId = undefined
    this.ecs.clear()
    await this.assetManager.loadSceneFromGltf(source)

    // Hardcode some test lights
    this.ecs.addComponentToEntity(
      this.ecs.createEntity(TransformComponent.fromValues(vec3.fromValues(0.1, 0.1, -0.1))),
      new LightComponent(vec3.fromValues(1.0, 1.0, 1.0), 5.0, LightType.POINT, false)
    )
    const sunTransform = TransformComponent.fromValues(vec3.fromValues(0.0, 0.0, -20.0))
    quat.mul(sunTransform.rotation, quat.fromAxisAngle(vec3.fromValues(1.0, 0.0, 0.0), Math.PI / 2), sunTransform.rotation)
    this.ecs.addComponentToEntity(this.ecs.createEntity(sunTransform), new LightComponent(vec3.fromValues(1.0, 1.0, 1.0), 2.0, LightType.SUN, true))
  }

  public prepareScene() {
    this.renderer.prepareScene(this.getSceneData())
  }
}
