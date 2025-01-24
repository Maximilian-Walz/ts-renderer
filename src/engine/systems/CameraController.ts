import { mat4, quat, utils, vec3 } from 'wgpu-matrix'
import { CameraControllerComponent, TransformComponent } from '../components/components'
import { InputManager } from '../InputManager'

type ControlledEntity = {
  transform: TransformComponent
  // TODO: Controller component should contain some settings in the future
  controller: CameraControllerComponent
}

export class CameraController {
  private inputManager: InputManager

  constructor(inputManager: InputManager) {
    this.inputManager = inputManager
  }

  public update(controlledEntities: ControlledEntity[]) {
    controlledEntities.forEach(({ transform }) => {
      this.applyCameraScale(transform)
      if (this.inputManager.mouseButtons[0]) {
        if (this.inputManager.keys.get('ShiftLeft')) {
          this.applyCameraPan(transform)
        } else {
          this.applyCameraRotation(transform)
        }
      }
    })
  }

  private applyCameraPan(transform: TransformComponent) {
    const currentMatrix = transform.parent!.toMatrix()
    const cameraX = mat4.getAxis(currentMatrix, 0)
    const cameraZ = mat4.getAxis(currentMatrix, 1)

    const target = transform.parent!.position
    const scale = transform.position[2] / 1000
    vec3.addScaled(target, cameraX, -this.inputManager.mouseDeltaX * scale, target)
    vec3.addScaled(target, cameraZ, this.inputManager.mouseDeltaY * scale, target)
  }

  private applyCameraRotation(transform: TransformComponent) {
    const angleY = -utils.degToRad(this.inputManager.mouseDeltaX / 2)
    const angleX = -utils.degToRad(this.inputManager.mouseDeltaY / 2)
    const target = transform.parent!.rotation

    const axis = mat4.getAxis(mat4.transpose(transform.parent!.toMatrix()), 1)
    const rotQuat = quat.fromAxisAngle(axis, angleY)
    quat.mul(target, rotQuat, target)
    quat.rotateX(target, angleX, target)
    quat.normalize(target, target)
  }

  private applyCameraScale(transform: TransformComponent) {
    const scale = this.inputManager.touchpadPinchDelta / 2

    vec3.addScaled(transform.position, vec3.fromValues(0, 0, 1), scale, transform.position)
    vec3.clamp(transform.position, 0.001, 100, transform.position)
  }
}
