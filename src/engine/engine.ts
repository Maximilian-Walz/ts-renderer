import Stats from 'stats.js'
import { quat, vec3 } from 'wgpu-matrix'
import { AssetManager } from './assets/AssetManager'
import { AutoRotateComponent, CameraComponent, CameraControllerComponent, ComponentType, LightComponent, LightType, MeshRendererComponent, TransformComponent } from './components'
import { EntityComponentSystem, EntityId, SimpleEcs } from './entity-component-system'
import { GPUDataInterface } from './GPUDataInterface'
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

  public assetManager: AssetManager
  public renderer!: Renderer
  public gpuDataInterface!: GPUDataInterface

  private inputManager: InputManager
  private rotator: Rotator
  private cameraController: CameraController
  private stats: Stats = new Stats()

  private activeCameraId?: EntityId

  constructor() {
    this.ecs = new SimpleEcs()
    this.inputManager = new InputManager()
    this.assetManager = new AssetManager()

    // Systems
    this.rotator = new Rotator()
    this.cameraController = new CameraController(this.inputManager)
  }

  async init() {
    let device
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported on this browser.')
    }
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('No appropriate GPUAdapter found.')
    }
    device = await adapter.requestDevice()
    device.lost.then((info) => {
      console.error(`WebGPU device was lost: ${info.message}`)
      if (info.reason !== 'destroyed') {
        this.init()
      }
    })

    this.gpuDataInterface = new GPUDataInterface(device)
    this.renderer = new Renderer(device, this.assetManager, this.gpuDataInterface)
    this.assetManager.loadDefaultAssets(this.gpuDataInterface)
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

  async loadScene(identifier: string) {
    this.activeCameraId = undefined
    this.ecs.clear()
    this.assetManager.loadGltfToGpu(identifier, this.gpuDataInterface)
    this.assetManager.spawnGltf(identifier, this.ecs)

    // Hardcode some test lights
    this.ecs.addComponentToEntity(
      this.ecs.createEntity(TransformComponent.fromValues(vec3.fromValues(0.1, 0.1, -0.1))),
      new LightComponent(vec3.fromValues(1.0, 1.0, 1.0), 5.0, LightType.POINT, false)
    )
    const sunRot = quat.fromAxisAngle(vec3.fromValues(1.0, 0.0, 0.0), -Math.PI / 2)
    const sunTransform = TransformComponent.fromValues(vec3.fromValues(0.0, 20.0, 0), sunRot, undefined, undefined)
    this.ecs.addComponentToEntity(this.ecs.createEntity(sunTransform), new LightComponent(vec3.fromValues(1.0, 1.0, 1.0), 2.0, LightType.SUN, true))
  }

  public prepareScene() {
    this.renderer.prepareScene(this.getSceneData())
  }
}
