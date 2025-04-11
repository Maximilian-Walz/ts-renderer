import { mat4, quat, utils, vec3 } from 'wgpu-matrix'
import { Script } from '../../engine/assets/Script'
import { TransformComponent } from '../../engine/components'
import { Engine } from '../../engine/Engine'

export class CameraControllerScript extends Script {
  public onCreate(): void {}

  public onInit(engine: Engine): void {}

  public onUpdate(engine: Engine): void {
    const transform = this.entity.getComponent(TransformComponent)
    this.applyCameraScale(transform, engine.inputManager.touchpadPinchDelta)
    if (engine.inputManager.mouseButtons[0]) {
      if (engine.inputManager.keys.get('ShiftLeft')) {
        this.applyCameraPan(transform, engine.inputManager.mouseDeltaX, engine.inputManager.mouseDeltaY)
      } else {
        this.applyCameraRotation(transform, engine.inputManager.mouseDeltaX, engine.inputManager.mouseDeltaY)
      }
    }
  }

  public onDestroy(engine: Engine): void {}

  private applyCameraPan(transform: TransformComponent, deltaX: number, deltaY: number) {
    const currentMatrix = transform.parent!.toMatrix()
    const cameraX = mat4.getAxis(currentMatrix, 0)
    const cameraZ = mat4.getAxis(currentMatrix, 1)

    const target = transform.parent!.position
    const scale = transform.position[2] / 1000
    vec3.addScaled(target, cameraX, -deltaX * scale, target)
    vec3.addScaled(target, cameraZ, deltaY * scale, target)
  }

  private applyCameraRotation(transform: TransformComponent, deltaX: number, deltaY: number) {
    const angleY = -utils.degToRad(deltaX / 2)
    const angleX = -utils.degToRad(deltaY / 2)
    const target = transform.parent!.rotation

    const axis = mat4.getAxis(mat4.transpose(transform.parent!.toMatrix()), 1)
    const rotQuat = quat.fromAxisAngle(axis, angleY)
    quat.mul(target, rotQuat, target)
    quat.rotateX(target, angleX, target)
    quat.normalize(target, target)
  }

  private applyCameraScale(transform: TransformComponent, delta: number) {
    const scale = delta / 2
    vec3.addScaled(transform.position, vec3.fromValues(0, 0, 1), scale, transform.position)
    vec3.clamp(transform.position, 0.001, 100, transform.position)
  }
}
