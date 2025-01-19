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
    const currentMatrix = transform.toMatrix()
    const cameraX = mat4.getAxis(mat4.transpose(currentMatrix), 0)
    const cameraZ = mat4.getAxis(mat4.transpose(currentMatrix), 1)

    const target = transform.parent!.position
    const scale = 1 / (transform.scale[0] * transform.scale[0] * 1000)
    vec3.add(target, vec3.scale(cameraX, this.inputManager.mouseDeltaX * scale), target)
    vec3.add(target, vec3.scale(cameraZ, -this.inputManager.mouseDeltaY * scale), target)
  }

  private applyCameraRotation(transform: TransformComponent) {
    const angleY = utils.degToRad(this.inputManager.mouseDeltaX / 2)
    const angleX = utils.degToRad(this.inputManager.mouseDeltaY / 2)
    const rotation = transform.rotation

    // Get current camera x-axis
    const axis = mat4.getAxis(mat4.transpose(transform.toMatrix()), 0)
    vec3.normalize(axis, axis)
    const rotQuat = quat.fromAxisAngle(axis, angleX)
    quat.mul(rotation, rotQuat, rotation)
    quat.rotateY(rotation, angleY, rotation)
    quat.normalize(rotation, rotation)
  }

  private applyCameraScale(transform: TransformComponent) {
    const factor = -this.inputManager.touchpadPinchDelta / 100 + 1
    const scale = transform.scale
    vec3.scale(scale, factor, scale)
    vec3.clamp(scale, 0.0001, 10, scale)
  }
}
