import { mat4, Mat4 } from 'wgpu-matrix'
import { ComponentType } from '.'
import { BufferBindGroupData } from '../rendering/bind-group-data/BufferBindGroupData'
import { Entity } from '../scenes/Entity'
import { BindGroupDataComponent } from './Component'

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

export type CameraProps = {
  name?: string
  cameraType: CameraType
  projectionData: PerspectiveData | OrthographicData
  zNear?: number
  zFar?: number
  useCanvasAspect?: boolean
}

export class CameraComponent extends BindGroupDataComponent<BufferBindGroupData> {
  name?: string
  cameraType: CameraType
  useCanvasAspect?: boolean
  projectionData: PerspectiveData | OrthographicData
  zNear: number
  zFar: number
  invViewProjection?: Mat4

  constructor(entity: Entity, props: CameraProps) {
    super(ComponentType.CAMERA, entity)
    this.name = props.name
    this.cameraType = props.cameraType
    this.useCanvasAspect = this.useCanvasAspect ?? true
    this.projectionData = props.projectionData
    this.zNear = props.zNear ?? 1
    this.zFar = props.zFar ?? 100
  }

  public createBindGroupData(device: GPUDevice): BufferBindGroupData {
    return new BufferBindGroupData(device, 256)
  }

  public static override getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return BufferBindGroupData.getLayout(device)
  }

  getProjection(cavasWidth?: number, canvasHeight?: number): Mat4 {
    let data
    switch (this.cameraType) {
      case CameraType.PERSPECTIVE:
        data = this.projectionData as PerspectiveData
        if (this.useCanvasAspect && (!cavasWidth || !canvasHeight)) throw Error('Camera is canvas constrained but no canvas width or height is provided.')
        const aspect = this.useCanvasAspect ? cavasWidth! / canvasHeight! : data.aspect
        return mat4.perspective(data.fov, aspect, this.zNear, this.zFar)
      case CameraType.ORTHOGRAPHIC:
        data = this.projectionData as OrthographicData
        return mat4.ortho(data.xMag, data.xMag, data.yMag, data.yMag, this.zNear, this.zFar)
    }
  }
}
