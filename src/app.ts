import { mat4, vec3 } from "wgpu-matrix"
import { AutoRotateComponent, CameraComponent, MeshRendererComponent, TransformComponent } from "./engine/components"
import { ComponentType, EntityComponentSystem } from "./engine/entity-component-system"
import { Renderer } from "./engine/systems/renderer"
import { Rotator } from "./engine/systems/rotator"
import Stats from "stats.js"
import { DebugGui } from "./engine/debug-gui"
import { AssetManager } from "./engine/assets/asset-manager"

export class App {
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private ecs: EntityComponentSystem
  private assetManager: AssetManager
  private rotator: Rotator

  private stats : Stats = new Stats()
  private debugGui : DebugGui = new DebugGui()
  
  constructor() {
    this.stats.showPanel(0)
    document.body.appendChild(this.stats.dom);

    this.canvas = document.querySelector("canvas")!
    if (!this.canvas) {
      throw new Error("No canvas found to render to")
    }

    this.ecs = new EntityComponentSystem()
    this.assetManager = new AssetManager(this.ecs)
    this.renderer = new Renderer(this.assetManager)
    this.rotator = new Rotator()
        
    this.createScene().then(() => {
      this.renderer.init(this.canvas).then(() => this.init())
    })

  }
  
  init() {
    const models = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as [TransformComponent, MeshRendererComponent][]
    this.renderer.initMeshRenderers(models)
    requestAnimationFrame(() => this.loop())
  }

  loop() {
    this.stats.begin()

    const rotatableModels = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.AUTO_ROTATE]) as [TransformComponent, AutoRotateComponent][]
    this.rotator.rotate(rotatableModels)

    const models = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as [TransformComponent, MeshRendererComponent][]
    this.renderer.render(models)

    this.stats.end();
    requestAnimationFrame(() => this.loop())
  }

  private async createScene() {
    this.assetManager.loadSceneFromGltf("https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Embedded/Duck.gltf")
    //this.assetManager.loadSceneFromGltf("/assets/gltf/Box.gltf")

    const cameraEntity = this.ecs.createEntity()
    const projectionMatrix  = mat4.perspective((2 * Math.PI) / 5, this.canvas.width / this.canvas.height, 1, 100.0)
    const cameraComponent = new CameraComponent(projectionMatrix)
    const transformComponent = new TransformComponent()
    transformComponent.transformationMatrix = mat4.translate(mat4.identity(), vec3.fromValues(0, -0.8, -2.37))
    this.ecs.addComponentToEntity(cameraEntity, cameraComponent)
    this.ecs.addComponentToEntity(cameraEntity, transformComponent)

    const camera = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.CAMERA])[0] as [TransformComponent, CameraComponent]
    this.renderer.setActiveCamera(camera)
    console.log(this.ecs)
  }
}

new App()
