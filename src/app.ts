import { mat4, vec3 } from "wgpu-matrix"
import { AutoRotateComponent, CameraComponent, MeshComponent, MeshRendererComponent, TransformComponent } from "./engine/components"
import { ComponentType, EntityComponentSystem } from "./engine/entity-component-system"
import { Renderer } from "./engine/systems/renderer"
import { Rotator } from "./engine/systems/rotator"

export class App {
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private ecs: EntityComponentSystem
  private rotator: Rotator

  constructor() {
    this.canvas = document.querySelector("canvas")!
    if (!this.canvas) {
      throw new Error("No canvas found to render to")
    }

    this.ecs = new EntityComponentSystem()
    this.createScene(this.ecs)

    this.rotator = new Rotator()

    this.renderer = new Renderer()
    this.renderer.init(this.canvas).then(() => this.init())
  }
  
  init() {
    const models = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as [TransformComponent, MeshRendererComponent][]
    this.renderer.initMeshRenderers(models)

    requestAnimationFrame(() => this.loop())
  }

  loop() {
    const rotatableModels = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.AUTO_ROTATE]) as [TransformComponent, AutoRotateComponent][]
    this.rotator.rotate(rotatableModels)

    const camera = this.ecs.getComponentsAsTuple([ComponentType.CAMERA])[0][0] as CameraComponent
    const models = this.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as [TransformComponent, MeshRendererComponent][]
    this.renderer.render(camera, models)

    requestAnimationFrame(() => this.loop())
  }

  private createScene(ecs: EntityComponentSystem) {
    const camera = ecs.createEntity()
    const viewMatrix = mat4.translate(mat4.identity(), vec3.fromValues(0, 0, -4))
    const projectionMatrix  = mat4.perspective((2 * Math.PI) / 5, this.canvas.width / this.canvas.height, 1, 100.0)
    ecs.addComponentToEntity(camera, new CameraComponent(viewMatrix, projectionMatrix))

    const cube = ecs.createEntity()
    const cubeTransform = new TransformComponent()
    mat4.translate(cubeTransform.transformationMatrix, vec3.fromValues(1.5, 0, 0), cubeTransform.transformationMatrix)
    ecs.addComponentToEntity(cube, cubeTransform)
    ecs.addComponentToEntity(cube, new MeshComponent(""))
    ecs.addComponentToEntity(cube, new MeshRendererComponent())
    ecs.addComponentToEntity(cube, new AutoRotateComponent(vec3.fromValues(1, 0, 0), 1))

    const cube2 = ecs.createEntity()
    const cube2Transform = new TransformComponent()
    mat4.translate(cube2Transform.transformationMatrix, vec3.fromValues(-1.5, 0, 0), cube2Transform.transformationMatrix)
    ecs.addComponentToEntity(cube2, cube2Transform)
    ecs.addComponentToEntity(cube2, new MeshComponent(""))
    ecs.addComponentToEntity(cube2, new MeshRendererComponent())
    ecs.addComponentToEntity(cube2, new AutoRotateComponent(vec3.fromValues(0, 1, 0), 1))
  }
}

new App()
