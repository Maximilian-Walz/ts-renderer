import Stats from 'stats.js'
import { AssetManager } from './assets/asset-manager'
import { AutoRotateComponent, ComponentType, MeshRendererComponent, TransformComponent } from './components/components'
import { EntityComponentSystem, SimpleEcs } from './entity-component-system'
import { CameraData, Renderer } from './systems/renderer'
import { Rotator } from './systems/rotator'

export type Scene = {
  name?: string
  source: string
}

export class Engine {
  ecs: EntityComponentSystem
  assetManager: AssetManager
  renderer: Renderer
  rotator: Rotator
  private stats: Stats = new Stats()

  private activeCamera?: CameraData

  constructor() {
    this.ecs = new SimpleEcs()
    this.assetManager = new AssetManager(this.ecs)
    this.renderer = new Renderer(this.assetManager)
    this.rotator = new Rotator()
  }

  async init() {
    await this.renderer.init()
  }

  setRenderTarget(canvas: HTMLCanvasElement) {
    this.renderer.setRenderTarget(canvas)
    this.initRendering()
  }

  setActiveCamera(cameraData: CameraData) {
    this.activeCamera = cameraData
  }

  private initRendering() {
    this.stats.showPanel(0)
    this.stats.dom.style.position = 'absolute'
    this.stats.dom.style.bottom = '0px'
    this.stats.dom.style.top = 'auto'
    document.body.appendChild(this.stats.dom)

    requestAnimationFrame(() => this.loop())
  }

  private loop() {
    this.stats.begin()

    if (this.activeCamera) {
      const rotatableModels = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.AUTO_ROTATE]) as [TransformComponent, AutoRotateComponent][]
      this.rotator.rotate(rotatableModels)

      const models = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as [TransformComponent, MeshRendererComponent][]
      this.renderer.render(
        models.map((model) => {
          return { transform: model[0], meshRenderer: model[1] }
        }),
        this.activeCamera
      )
    }

    this.stats.end()
    requestAnimationFrame(() => this.loop())
  }

  async loadScene(source: string) {
    this.ecs.clear()
    await this.assetManager.loadSceneFromGltf(source)
    const models = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as [TransformComponent, MeshRendererComponent][]
    this.renderer.prepareGpuBuffers()
    this.renderer.prepareGpuTextures()
    this.renderer.prepareMaterials()
    this.renderer.prepareMeshRenderers(models)
  }
}
