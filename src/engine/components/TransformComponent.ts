import { Mat4, Quat, Vec3, mat4, quat, vec3 } from 'wgpu-matrix'
import { ComponentType } from '.'
import { BufferBindGroupData } from '../rendering/bind-group-data/BufferBindGroupData'
import { Entity } from '../scenes/Entity'
import { BindGroupDataComponent } from './Component'

export type TransformProps = {
  name?: string
  position?: Vec3
  rotation?: Quat
  scale?: Vec3
  parentTransform?: TransformComponent
}

export class TransformComponent extends BindGroupDataComponent<BufferBindGroupData> {
  name?: string
  position: Vec3
  rotation: Quat
  scale: Vec3
  parent?: TransformComponent

  constructor(entity: Entity, props: TransformProps) {
    super(ComponentType.TRANSFORM, entity)
    this.name = props.name
    this.parent = props.parentTransform
    this.position = props.position ?? vec3.zero()
    this.rotation = props.rotation ?? quat.identity()
    this.scale = props.scale ?? vec3.fromValues(1, 1, 1)
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
}
