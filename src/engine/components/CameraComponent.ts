import { mat4, Mat4 } from 'wgpu-matrix'
import { Component, ComponentType } from '.'

export enum CameraType {
  PERSPECTIVE,
  ORTHOGRAPHIC,
}

export type PerspectiveData = {
  fov: number
  aspect: number
}

export type OrthographicData = {
  xMag: number
  yMag: number
}

export class CameraComponent extends Component {
  name?: string
  cameraType: CameraType
  useCanvasAspect?: boolean
  data: PerspectiveData | OrthographicData
  zNear: number
  zFar: number
  invViewProjection?: Mat4

  bindGroup: GPUBindGroup | undefined
  static bindGroupLayout: GPUBindGroupLayout
  matricesBuffer: GPUBuffer | undefined

  constructor(cameraType: CameraType, data: PerspectiveData | OrthographicData, zNear?: number, zFar?: number) {
    super(ComponentType.CAMERA)
    this.cameraType = cameraType
    this.useCanvasAspect = true
    this.data = data
    this.zNear = zNear ?? 1
    this.zFar = zFar ?? 100
  }

  getProjection(cavasWidth?: number, canvasHeight?: number): Mat4 {
    let data
    switch (this.cameraType) {
      case CameraType.PERSPECTIVE:
        data = this.data as PerspectiveData
        if (this.useCanvasAspect && (!cavasWidth || !canvasHeight)) throw Error('Camera is canvas constrained but no canvas width or height is provided.')
        const aspect = this.useCanvasAspect ? cavasWidth! / canvasHeight! : data.aspect
        return mat4.perspective(data.fov, aspect, this.zNear, this.zFar)
      case CameraType.ORTHOGRAPHIC:
        data = this.data as OrthographicData
        return mat4.ortho(data.xMag, data.xMag, data.yMag, data.yMag, this.zNear, this.zFar)
    }
  }

  toJson(): Object {
    return {
      type: this.type,
      name: this.name,
      data: this.data,
      cameraType: this.cameraType,
      useCanvasAspect: this.useCanvasAspect,
      zNear: this.zNear,
      zFar: this.zFar,
    }
  }
}
