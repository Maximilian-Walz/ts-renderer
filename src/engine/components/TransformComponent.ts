import { Mat4, Quat, Vec3, mat3, mat4, quat, vec3 } from 'wgpu-matrix'
import { BindGroupDataComponent, ComponentType } from '.'
import { BufferBindGroupData } from '../rendering/bind-group-data/BufferBindGroupData'

export class TransformComponent extends BindGroupDataComponent<BufferBindGroupData> {
  name: string | undefined
  position: Vec3
  rotation: Quat
  scale: Vec3
  parent?: TransformComponent

  constructor(parentTransform?: TransformComponent) {
    super(ComponentType.TRANSFORM)
    this.parent = parentTransform
    this.position = vec3.zero()
    this.rotation = quat.identity()
    this.scale = vec3.fromValues(1, 1, 1)
  }

  public createBindGroupData(device: GPUDevice): BufferBindGroupData {
    return new BufferBindGroupData(device, 64 * 3)
  }

  public static override getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return BufferBindGroupData.getLayout(device)
  }

  setMatrix(tranformationMatrix: Mat4) {
    vec3.copy(vec3.getTranslation(tranformationMatrix), this.position)
    vec3.copy(vec3.getScaling(tranformationMatrix), this.scale)
    quat.copy(quat.fromMat(mat3.fromMat4(tranformationMatrix)), this.rotation)
  }

  static fromMatrix(tranformationMatrix: Mat4, parentTransform?: TransformComponent) {
    const transformComponent = new TransformComponent(parentTransform)
    transformComponent.position = vec3.getTranslation(tranformationMatrix)
    transformComponent.scale = vec3.getScaling(tranformationMatrix)
    transformComponent.rotation = quat.fromMat(mat3.fromMat4(tranformationMatrix))

    return transformComponent
  }

  static fromValues(position?: Vec3, rotation?: Quat, scale?: Vec3, parentTransform?: TransformComponent) {
    const transformComponent = new TransformComponent(parentTransform)
    if (position) transformComponent.position = position
    if (rotation) transformComponent.rotation = rotation
    if (scale) transformComponent.scale = scale
    return transformComponent
  }

  static calculateGlobalTransform(transform: TransformComponent): Mat4 {
    if (transform.parent != undefined) {
      return mat4.multiply(this.calculateGlobalTransform(transform.parent), transform.toMatrix())
    } else {
      return transform.toMatrix()
    }
  }

  toMatrix() {
    const rotation = mat4.fromQuat(this.rotation)
    const translation = mat4.translation(this.position)
    const matrix = mat4.mul(translation, rotation)
    mat4.scale(matrix, this.scale, matrix)
    return matrix
  }

  toJson(): Object {
    return {
      type: this.type,
      name: this.name,
      position: this.position,
      rotation: this.rotation,
      scale: this.scale,
    }
  }
}
