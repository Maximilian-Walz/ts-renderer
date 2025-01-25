import { Vec3 } from 'wgpu-matrix'
import { Component } from './Component'

export const NUM_OF_COMPONENT_TYPES = 6
export enum ComponentType {
  TRANSFORM,
  CAMERA,
  MESH_RENDERER,
  LIGHT,
  AUTO_ROTATE,
  CAMERA_CONTROLLER,
}

export * from './CameraComponent'
export * from './Component'
export * from './LightComponent'
export * from './MeshRendererComponent'
export * from './TransformComponent'

export class AutoRotateComponent extends Component {
  axis: Vec3
  speed: number

  constructor(axis: Vec3, speed: number) {
    super(ComponentType.AUTO_ROTATE)
    this.axis = axis
    this.speed = speed
  }

  toJson(): Object {
    return {
      type: this.type,
      axis: this.axis,
      speed: this.speed,
    }
  }
}

export class CameraControllerComponent extends Component {
  constructor() {
    super(ComponentType.CAMERA_CONTROLLER)
  }

  toJson(): Object {
    return {}
  }
}
