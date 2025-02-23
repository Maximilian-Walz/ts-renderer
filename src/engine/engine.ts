import Stats from 'stats.js'
import { AssetManager } from './assets/AssetManager'
import { CameraComponent, CameraControllerComponent, ComponentType, LightComponent, MeshRendererComponent, TransformComponent } from './components'
import { GPUDataInterface } from './GPUDataInterface'
import { InputManager } from './InputManager'
import { Scene } from './scenes/Scene'
import { SceneManger } from './scenes/SceneManager'
import { CameraController } from './systems/CameraController'
import { RenderData, Renderer } from './systems/Renderer'
import { Rotator } from './systems/Rotator'

export class Engine {
  public assetManager!: AssetManager
  public gpuDataInterface!: GPUDataInterface
  public sceneManager: SceneManger

  private inputManager: InputManager
  private renderer!: Renderer
  private rotator: Rotator
  private cameraController: CameraController
  private stats: Stats = new Stats()

  private activeCameraId?: string

  private abortScheduled: boolean = false

  constructor() {
    this.sceneManager = new SceneManger()
    this.inputManager = new InputManager()

    // Systems
    this.rotator = new Rotator()
    this.cameraController = new CameraController(this.inputManager)
  }

  async init(device?: GPUDevice) {
    if (device == undefined) {
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
    }

    this.gpuDataInterface = new GPUDataInterface(device)
    this.assetManager = new AssetManager(this.gpuDataInterface)
    this.renderer = new Renderer(device, this.assetManager, this.gpuDataInterface)
    await this.assetManager.loadDefaultAssets()
  }

  setRenderTarget(canvas: HTMLCanvasElement) {
    this.renderer.setRenderTarget(canvas)
    this.inputManager.setTarget(canvas)
    this.initRendering()
  }

  setActiveCamera(cameraId: string) {
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

  public abort() {
    this.abortScheduled = true
  }

  private getRenderData(activeScene: Scene): RenderData {
    const models = activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER])
    const lights = activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.LIGHT])
    const cameras = activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.CAMERA])

    let activeCamera
    if (this.activeCameraId != undefined) {
      activeCamera = this.sceneManager.getActiveScene().getEntity(this.activeCameraId)
    }

    return {
      modelsData: models.map((components) => {
        return { transform: components.transform as TransformComponent, meshRenderer: components.meshRenderer as MeshRendererComponent }
      }),
      lightsData: lights.map((components) => {
        return { transform: components.transform as TransformComponent, light: components.light as LightComponent }
      }),
      camerasData: cameras.map((components) => {
        return { transform: components.transform as TransformComponent, camera: components.camera as CameraComponent }
      }),
      activeCameraData: activeCamera
        ? {
            transform: activeCamera.getComponent(ComponentType.TRANSFORM) as TransformComponent,
            camera: activeCamera.getComponent(ComponentType.CAMERA) as CameraComponent,
          }
        : undefined,
    }
  }

  private loop() {
    if (this.abortScheduled) {
      this.abortScheduled = false
      return
    }

    this.stats.begin()

    if (this.sceneManager.hasActiveScene()) {
      const activeScene = this.sceneManager.getActiveScene()
      const rotatableModels = activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.AUTO_ROTATE])
      //this.rotator.rotate(rotatableModels)

      const controlledEntities = activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.CAMERA_CONTROLLER])
      this.cameraController.update(
        controlledEntities.map((components) => {
          return { transform: components.transform as TransformComponent, controller: components.cameraController as CameraControllerComponent }
        })
      )
      this.renderer.render(this.getRenderData(activeScene))

      this.inputManager.clearDeltas()
      this.stats.end()
    }
    requestAnimationFrame(() => this.loop())
  }

  // TODO: Should not be neccessary to have this in the future, but need to separate components and their GPU elements first
  public updateActiveSceneRenderData() {
    this.renderer.prepareScene(this.getRenderData(this.sceneManager.getActiveScene()))
  }
}
