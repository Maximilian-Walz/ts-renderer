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

export type ProjectionData = OrthographicData | PerspectiveData

export type CameraProps = {
  cameraType: CameraType
  projectionData: ProjectionData
  zNear: number
  zFar: number
  useCanvasAspect?: boolean
}

export class CameraComponent extends BindGroupDataComponent<BufferBindGroupData, CameraProps> {
  invViewProjection?: Mat4

  constructor(entity: Entity, props: CameraProps) {
    super(ComponentType.CAMERA, entity, props)
  }

  public override createBindGroupData(device: GPUDevice): BufferBindGroupData {
    return new BufferBindGroupData(device, 256)
  }

  public static override getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return BufferBindGroupData.getLayout(device)
  }

  getProjection(cavasWidth?: number, canvasHeight?: number): Mat4 {
    let data
    switch (this.props.cameraType) {
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

  get cameraType() {
    return this.props.cameraType
  }

  get projectionData() {
    return this.props.projectionData
  }

  get zNear() {
    return this.props.zNear
  }

  get zFar() {
    return this.props.zFar
  }

  get useCanvasAspect() {
    return this.props.useCanvasAspect ?? true
  }

  set cameraType(cameraType: CameraType) {
    this.cameraType = cameraType
  }

  set projectionData(projectionData: ProjectionData) {
    this.projectionData = projectionData
  }

  set zNear(zNear: number) {
    this.zNear = zNear
  }

  set zFar(zFar: number) {
    this.zFar = zFar
  }

  set useCanvasAspect(useCanvasAspect: boolean) {
    this.useCanvasAspect = useCanvasAspect
  }
}
