import { Mat4, Quat, Vec3, mat3, mat4, quat, vec3 } from 'wgpu-matrix'
import { EntityId } from './entity-component-system'

export const NUM_OF_ENTITY_TYPES = 4
export enum ComponentType {
  TRANSFORM,
  CAMERA,
  MESH_RENDERER,
  AUTO_ROTATE,
}

export abstract class Component {
  type: ComponentType
  abstract toJson(): Object

  constructor(type: ComponentType) {
    this.type = type
  }
}

export class TransformComponent extends Component {
  name: string | undefined
  position: Vec3
  rotation: Quat
  scale: Vec3
  entityId?: EntityId
  parent?: TransformComponent

  constructor(parentTransform?: TransformComponent) {
    super(ComponentType.TRANSFORM)
    this.parent = parentTransform
    this.position = vec3.zero()
    this.rotation = quat.identity()
    this.scale = vec3.fromValues(1, 1, 1)
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

  toMatrix() {
    const matrix = mat4.fromQuat(this.rotation)
    matrix[12] = this.position[0]
    matrix[13] = this.position[1]
    matrix[14] = this.position[2]
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
      entityId: this.entityId,
      parent: this.parent?.entityId,
    }
  }
}

export enum VertexAttributeType {
  POSITION = 'POSITION',
  NORMAL = 'NORMAL',
  TANGENT = 'TANGEN',
  TEXCOORD_0 = 'TEXCOORD_0',
}

export enum BufferDataComponentType {
  SIGNED_BYTE = 5120,
  UNSIGNED_BYTE = 5121,
  SIGNED_SHORT = 5122,
  UNSIGNED_SHORT = 5123,
  UNSIGNED_INT = 5125,
  FLOAT = 5126,
}

export enum BufferDataType {
  SCALAR = 'SCALAR',
  VEC2 = 'VEC2',
  VEC3 = 'VEC3',
  VEC4 = 'VEC4',
  MAT2 = 'MAT2',
  MAT3 = 'MAT3',
  MAT4 = 'MAT4',
}

export type BufferAccessor = {
  bufferIndex: number
  offset: number
  componentType: BufferDataComponentType
  type: BufferDataType
  count: number
}

export type PrimitiveRenderData = {
  bindGroup: GPUBindGroup | undefined
  indexBufferAccessor: BufferAccessor
  vertexAttributes: Map<VertexAttributeType, BufferAccessor>
  mode: number | undefined
}

export class MeshRendererComponent extends Component {
  name?: string
  bindGroup: GPUBindGroup | undefined
  modelMatrixBuffer: GPUBuffer | undefined
  primitives: PrimitiveRenderData[] = []

  constructor() {
    super(ComponentType.MESH_RENDERER)
  }

  toJson(): Object {
    return {
      type: this.type,
      name: this.name,
      primitives: this.primitives.map((primitiveData) => {
        return {
          material: 'Some material data...',
        }
      }),
    }
  }
}

export type PerspectiveData = {
  fov: number
  aspect: number
}

export type OrthographicData = {
  xMag: number
  yMag: number
}

export enum CameraType {
  PERSPECTIVE,
  ORTHOGRAPHIC,
}

export class CameraComponent extends Component {
  name?: string
  cameraType: CameraType
  useCanvasAspect?: boolean
  data: PerspectiveData | OrthographicData
  zNear: number
  zFar: number

  constructor(cameraType: CameraType, data: PerspectiveData | OrthographicData, zNear?: number, zFar?: number) {
    super(ComponentType.CAMERA)
    this.cameraType = cameraType
    this.useCanvasAspect = true
    this.data = data
    this.zNear = zNear ??= 1
    this.zFar = zFar ??= 100
  }

  getProjection(cavasWidth?: number, canvasHeight?: number): Mat4 {
    let data
    switch (this.cameraType) {
      case CameraType.PERSPECTIVE:
        data = this.data as PerspectiveData
        if (this.useCanvasAspect && (!cavasWidth || !canvasHeight)) throw Error('Camera is canvas constrained but no canvas width or height is not provided.')
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
