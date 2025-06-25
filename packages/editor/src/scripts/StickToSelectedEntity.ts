import { Engine, Entity, EventMap, Script, TransformComponent } from "@my/engine"
import { vec3 } from "wgpu-matrix"

export type StickToSelectedEntityProps = {}

export class StickToSelectedEntity extends Script<StickToSelectedEntityProps> {
  private target: Entity | undefined
  private entitySelectListener: ((e: EventMap["entitySelect"]) => void) | null = null

  public override onInit(engine: Engine) {
    this.entitySelectListener = (e) => (this.target = e.entity)
    engine.eventManger.on("entitySelect", this.entitySelectListener)
  }

  public override onDestroy(engine: Engine): void {
    if (this.entitySelectListener) {
      engine.eventManger.off("entitySelect", this.entitySelectListener)
      this.entitySelectListener = null
    }
  }

  public override onUpdate(engine: Engine): void {
    if (this.target != undefined) {
      const myTransform = this.entity.getComponent(TransformComponent)
      const selectedTransform = this.target.getComponent(TransformComponent)
      myTransform.position = selectedTransform.position
      myTransform.rotation = selectedTransform.rotation

      const cameraTransform = engine.sceneManager
        .getActiveScene()
        .getEntity(engine.getActiveCamera()!)
        .getComponent(TransformComponent)
      const distance = vec3.distance(cameraTransform.position, myTransform.position) / 20
      myTransform.scale = vec3.fromValues(distance, distance, distance)
    }
  }
}
