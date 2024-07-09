import { Mat4, mat4, vec3 } from 'wgpu-matrix'
import { AssetManager } from './assets/asset-manager'
import { AutoRotateComponent, CameraComponent, MeshRendererComponent, TransformComponent } from './components'
import { ArchetypeECS, ComponentType, EntityComponentSystem } from './entity-component-system'
import { Renderer } from './systems/renderer'
import { Rotator } from './systems/rotator'
import Stats from 'stats.js'

export class Engine {
  ecs: EntityComponentSystem
  assetManager: AssetManager
  renderer: Renderer
  rotator: Rotator
  private stats: Stats = new Stats()

  constructor() {
    this.ecs = new ArchetypeECS()
    this.assetManager = new AssetManager(this.ecs)
    this.renderer = new Renderer(this.assetManager)
    this.rotator = new Rotator()
  }

  async init() {
    await this.createScene()
    await this.renderer.init()
  }

  setRenderTarget(canvas: HTMLCanvasElement) {
    this.renderer.setRenderTarget(canvas)
    this.initRendering()
  }

  private initRendering() {
    this.stats.showPanel(0)
    document.body.appendChild(this.stats.dom)

    const models = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as [TransformComponent, MeshRendererComponent][]
    this.renderer.prepareMeshRenderers(models)

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

  private async createScene() {
    this.assetManager.loadSceneFromGltf(
      //'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Embedded/DamagedHelmet.gltf'
      //'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Embedded/Duck.gltf'
      //'/assets/gltf/Box.gltf'
      '/assets/gltf/hirarchy.glb'
    )

    const projectionMatrix = mat4.perspective((2 * Math.PI) / 5, 900 / 700, 1, 100.0)
    const cameraComponent = new CameraComponent(projectionMatrix)
    //const transformComponent = new TransformComponent(mat4.translate(mat4.identity(), vec3.fromValues(0, -0.8, -2.37)) as Mat4)
    const transformComponent = new TransformComponent(mat4.translate(mat4.identity(), vec3.fromValues(0, 0, -3.5)) as Mat4)
    const cameraEntity = this.ecs.createEntity(transformComponent)
    this.ecs.addComponentToEntity(cameraEntity, cameraComponent)
    this.ecs.addComponentToEntity(cameraEntity, transformComponent)

    const camera = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.CAMERA])[0] as [TransformComponent, CameraComponent]
    this.renderer.setActiveCamera(camera)
  }
}
