import Stats from 'stats.js'
import { AssetManager } from './assets/asset-manager'
import { AutoRotateComponent, ComponentType, MeshRendererComponent, TransformComponent } from './components'
import { EntityComponentSystem, SimpleEcs } from './entity-component-system'
import { Renderer } from './systems/renderer'
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

    const rotatableModels = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.AUTO_ROTATE]) as [TransformComponent, AutoRotateComponent][]
    this.rotator.rotate(rotatableModels)

    const models = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as [TransformComponent, MeshRendererComponent][]
    this.renderer.render(models)

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
