import { Mat4, Quat, Vec3, mat4 } from 'wgpu-matrix'
import { ComponentType } from '.'
import { BufferBindGroupData } from '../rendering/bind-group-data/BufferBindGroupData'
import { Entity } from '../scenes/Entity'
import { BindGroupDataComponent } from './Component'

export type TransformProps = {
  position: Vec3
  rotation: Quat
  scale: Vec3
  parent?: TransformComponent
}

export class TransformComponent extends BindGroupDataComponent<BufferBindGroupData, TransformProps> {
  constructor(entity: Entity, props: TransformProps) {
    super(ComponentType.TRANSFORM, entity, props)
  }

  public createBindGroupData(device: GPUDevice): BufferBindGroupData {
    return new BufferBindGroupData(device, 64 * 3)
  }

  public static override getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return BufferBindGroupData.getLayout(device)
  }

  static calculateGlobalTransform(transform: TransformComponent): Mat4 {
    if (transform.parent != undefined) {
      return mat4.multiply(this.calculateGlobalTransform(transform.parent), transform.toMatrix())
    } else {
      return transform.toMatrix()
    }
  }

  public toMatrix() {
    const rotation = mat4.fromQuat(this.rotation)
    const translation = mat4.translation(this.position)
    const matrix = mat4.mul(translation, rotation)
    mat4.scale(matrix, this.scale, matrix)
    return matrix
  }

  get position() {
    return this.props.position
  }

  get rotation() {
    return this.props.rotation
  }

  get scale() {
    return this.props.scale
  }

  get parent() {
    return this.props.parent
  }

  set position(position: Vec3) {
    this.position = position
  }

  set rotation(rotation: Quat) {
    this.rotation = rotation
  }

  set scale(scale: Vec3) {
    this.scale = scale
  }

  set parent(parent: TransformComponent | undefined) {
    this.parent = parent
  }
}
