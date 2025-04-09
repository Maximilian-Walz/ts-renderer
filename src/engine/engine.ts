import Stats from 'stats.js'
import { AssetManager } from './assets/AssetManager'
import { CameraComponent, CameraControllerComponent, ComponentType, ScriptComponent, TransformComponent } from './components'
import { GPUDataInterface } from './GPUDataInterface'
import { InputManager } from './InputManager'
import { EntityId } from './scenes/Entity'
import { Scene } from './scenes/Scene'
import { SceneManger } from './scenes/SceneManager'
import { CameraController } from './systems/CameraController'
import { BillboardsData, CameraData, LightData, ModelData, RenderData, Renderer, ShadowMapLightData } from './systems/Renderer'
import { ScriptExecutor } from './systems/ScriptExecutor'

export class Engine {
  public assetManager!: AssetManager
  public gpuDataInterface!: GPUDataInterface
  public sceneManager: SceneManger

  private inputManager: InputManager
  private renderer!: Renderer
  private scriptExecutor: ScriptExecutor
  private cameraController: CameraController
  private stats: Stats = new Stats()

  private activeCameraId?: EntityId

  private abortScheduled: boolean = false

  constructor() {
    this.sceneManager = new SceneManger()
    this.inputManager = new InputManager()

    // Systems
    this.scriptExecutor = new ScriptExecutor()
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
    this.renderer = new Renderer(device, this.gpuDataInterface)
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

  private getRenderData(activeScene: Scene, activeCameraId: EntityId): RenderData {
    const activeCamera = this.sceneManager.getActiveScene().getEntity(activeCameraId)
    return {
      modelsData: activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as ModelData[],
      lightsData: activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.LIGHT]) as LightData[],
      camerasData: activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.CAMERA]) as CameraData[],
      lightsWithShadowMap: activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.LIGHT, ComponentType.SHADOW_MAP]) as ShadowMapLightData[],
      billboardsData: activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.BILLBOARD]) as BillboardsData[],
      activeCameraData: {
        transform: activeCamera.getComponent(ComponentType.TRANSFORM) as TransformComponent,
        camera: activeCamera.getComponent(ComponentType.CAMERA) as CameraComponent,
      },
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

      const scriptsData = activeScene.getComponents([ComponentType.SCRIPT]) as { scriptComponent: ScriptComponent }[]
      this.scriptExecutor.updateScripts(scriptsData.map((scriptData) => scriptData.scriptComponent))

      const controlledEntities = activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.CAMERA_CONTROLLER])
      this.cameraController.update(
        controlledEntities.map((components) => {
          return { transform: components.transform as TransformComponent, controller: components.cameraController as CameraControllerComponent }
        })
      )

      if (this.activeCameraId != undefined) {
        this.renderer.render(this.getRenderData(activeScene, this.activeCameraId))
      }

      this.inputManager.clearDeltas()
      this.stats.end()
    }
    requestAnimationFrame(() => this.loop())
  }
}
