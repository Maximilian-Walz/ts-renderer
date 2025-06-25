import { Engine, Script, TransformComponent } from "@my/engine"
import { mat4, Vec3, vec3 } from "wgpu-matrix"

export class OrbitingCameraController extends Script<{}> {
  private target: Vec3 = vec3.zero()
  private distance: number = 10
  private phi: number = 0
  private theta: number = 0

  public override onUpdate(engine: Engine): void {
    const transform = this.entity.getComponent(TransformComponent)
    this.updateDistance(engine.inputManager.touchpadPinchDelta)
    if (engine.inputManager.mouseButtons[0]) {
      if (engine.inputManager.keys.get("ShiftLeft")) {
        this.updateTargetPosition(transform, engine.inputManager.mouseDeltaX, engine.inputManager.mouseDeltaY)
      } else {
        this.updateRotation(engine.inputManager.mouseDeltaX, engine.inputManager.mouseDeltaY)
      }
    }

    const eye = vec3.subtract(this.target, vec3.fromValues(0, 0, this.distance))
    vec3.rotateX(eye, this.target, this.theta, eye)
    vec3.rotateY(eye, this.target, this.phi, eye)

    const up = vec3.fromValues(0, 1, 0)
    vec3.rotateX(up, vec3.zero(), this.theta, up)
    vec3.rotateY(up, vec3.zero(), this.phi, up)

    transform.setFromMatrix(mat4.cameraAim(eye, this.target, up))
  }

  private updateTargetPosition(transform: TransformComponent, deltaX: number, deltaY: number) {
    const currentMatrix = transform.toMatrix()
    const cameraX = mat4.getAxis(currentMatrix, 0)
    const cameraZ = mat4.getAxis(currentMatrix, 1)
    const scale = this.distance / 1000

    vec3.addScaled(this.target, cameraX, -deltaX * scale, this.target)
    vec3.addScaled(this.target, cameraZ, deltaY * scale, this.target)
  }

  private updateRotation(deltaX: number, deltaY: number) {
    this.phi -= deltaX / 100
    this.phi = this.phi % (2 * Math.PI)

    this.theta += deltaY / 100
    this.theta = this.theta % (2 * Math.PI)
  }

  private updateDistance(delta: number) {
    const scale = delta / 2
    this.distance += scale
    this.distance = Math.max(this.distance, 0)
  }
}
