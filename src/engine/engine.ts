import Stats from 'stats.js'
import { vec3 } from 'wgpu-matrix'
import { AssetManager } from './assets/AssetManager'
import { AutoRotateComponent, ComponentType, LightComponent, MeshRendererComponent, TransformComponent } from './components/components'
import { EntityComponentSystem, SimpleEcs } from './entity-component-system'
import { CameraData, Renderer } from './systems/Renderer'
import { Rotator } from './systems/Rotator'
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
      const lights = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.LIGHT]) as [TransformComponent, LightComponent][]
      this.renderer.renderScene(
        models.map((model) => {
          return { transform: model[0], meshRenderer: model[1] }
        }),
        lights.map((light) => {
          return { transform: light[0], light: light[1] }
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

    this.ecs.addComponentToEntity(
      this.ecs.createEntity(TransformComponent.fromValues(vec3.fromValues(0.0, 0.0, -1.0))),
      new LightComponent(vec3.fromValues(1.0, 1.0, 1.0), 5.0, true)
    )
    this.ecs.addComponentToEntity(this.ecs.createEntity(TransformComponent.fromValues(vec3.fromValues(10.0, 200.0, 10.0))), new LightComponent(vec3.fromValues(1.0, 1.0, 1.0), 5.0))

    this.renderer.prepareGpuBuffers()
    this.renderer.prepareGpuTextures()
    this.renderer.prepareMaterials()

    const models = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as [TransformComponent, MeshRendererComponent][]
    this.renderer.prepareMeshRenderers(models)

    const lights = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.LIGHT]) as [TransformComponent, LightComponent][]
    this.renderer.prepareShadowMaps(
      lights.map((light) => {
        return { transform: light[0], light: light[1] }
      })
    )
  }
}
