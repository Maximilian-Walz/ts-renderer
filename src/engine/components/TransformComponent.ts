import { Mat4, Quat, Vec3, mat4, quat, vec3 } from 'wgpu-matrix'
import { ComponentType } from '.'
import { BufferBindGroupData } from '../rendering/bind-group-data/BufferBindGroupData'
import { BindGroupDataComponent } from './Component'

export type TransformProps = {
  position: Vec3
  rotation: Quat
  scale: Vec3
}

export class TransformComponent extends BindGroupDataComponent<BufferBindGroupData, TransformProps> {
  public globalTransform: Mat4 = mat4.identity()

  get type(): ComponentType {
    return TransformComponent.getType()
  }

  public static override getType(): ComponentType {
    return ComponentType.TRANSFORM
  }

  public createBindGroupData(device: GPUDevice): BufferBindGroupData {
    return new BufferBindGroupData(device, 64 * 3)
  }

  public static override getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return BufferBindGroupData.getLayout(device)
  }

  public setFromMatrix(matrix: Mat4) {
    this.position = vec3.getTranslation(matrix)
    this.scale = vec3.getScaling(matrix)
    this.rotation = quat.fromMat(matrix)
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

  set position(position: Vec3) {
    this.props.position = position
  }

  set rotation(rotation: Quat) {
    this.props.rotation = rotation
  }

  set scale(scale: Vec3) {
    this.props.scale = scale
  }
}
