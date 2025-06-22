import Stats from 'stats.js'
import { AssetManager } from './assets/AssetManager'
import { ComponentType, ScriptComponent } from './components'
import { EventManager } from './events/EventManager'
import { GPUDataInterface } from './GPUDataInterface'
import { InputManager } from './InputManager'
import { EntityId } from './scenes/Entity'
import { SceneManger } from './scenes/SceneManager'
import { HierarchyBuilder, HierarchyData } from './systems/HierarchyBuilder'
import { RendererSystem } from './systems/RendererSystem'
import { ScriptExecutor } from './systems/ScriptExecutor'

export class Engine {
  public assetManager!: AssetManager
  public gpuDataInterface!: GPUDataInterface
  public sceneManager: SceneManger
  public inputManager: InputManager
  public eventManger: EventManager

  private renderer!: RendererSystem
  private scriptExecutor: ScriptExecutor
  private hierarchyBuilder: HierarchyBuilder

  private stats: Stats = new Stats()

  private activeCameraId?: EntityId

  private abortScheduled: boolean = false

  constructor() {
    this.sceneManager = new SceneManger()
    this.inputManager = new InputManager()
    this.eventManger = new EventManager()

    // Systems
    this.scriptExecutor = new ScriptExecutor(this)
    this.hierarchyBuilder = new HierarchyBuilder()
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
    this.renderer = new RendererSystem(device, this.gpuDataInterface)
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

  public reloadScene() {
    const activeScene = this.sceneManager.getActiveScene()
    const hierarchiesData = activeScene.getComponents([ComponentType.TRANSFORM, ComponentType.HIERARCHY]) as HierarchyData[]
    this.hierarchyBuilder.rebuildHierarchy(activeScene, hierarchiesData)
  }

  private loop() {
    if (this.abortScheduled) {
      this.abortScheduled = false
      return
    }

    this.stats.begin()

    if (this.sceneManager.hasActiveScene()) {
      const activeScene = this.sceneManager.getActiveScene()
      this.hierarchyBuilder.updateGlobalTransforms()

      const scriptsData = activeScene.getComponents([ComponentType.SCRIPT]) as { script: ScriptComponent }[]
      this.scriptExecutor.updateScripts(scriptsData.map((scriptData) => scriptData.script))

      if (this.activeCameraId != undefined) {
        this.renderer.render(activeScene, this.activeCameraId)
      }

      this.inputManager.clearDeltas()
      this.stats.end()
    }

    this.eventManger.process()
    requestAnimationFrame(() => this.loop())
  }
}
