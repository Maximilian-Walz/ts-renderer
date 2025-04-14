import { mat4, quat, utils } from 'wgpu-matrix'
import { Script } from '../../engine/assets/Script'
import { TransformComponent } from '../../engine/components'
import { Engine } from '../../engine/Engine'

export class FirstPersonCameraController extends Script {
  public override onUpdate(engine: Engine): void {
    const transform = this.entity.getComponent(TransformComponent)
    if (engine.inputManager.mouseButtons[0]) {
      this.applyCameraRotation(transform, engine.inputManager.mouseDeltaX, engine.inputManager.mouseDeltaY)
    }
  }

  private applyCameraRotation(transform: TransformComponent, deltaX: number, deltaY: number) {
    const angleY = -utils.degToRad(deltaX / 2)
    const angleX = -utils.degToRad(deltaY / 2)
    const rotation = transform.rotation

    const axis = mat4.getAxis(mat4.transpose(transform.toMatrix()), 1)
    const rotQuat = quat.fromAxisAngle(axis, angleY)
    quat.mul(rotation, rotQuat, rotation)
    quat.rotateX(rotation, angleX, rotation)
    quat.normalize(rotation, rotation)
  }
}
