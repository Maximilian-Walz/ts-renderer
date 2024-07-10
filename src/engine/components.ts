import { Mat4, Vec3, mat4 } from 'wgpu-matrix'
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
  transformationMatrix: Mat4
  entityId?: EntityId
  parent?: TransformComponent

  constructor(tranformationMatrix?: Mat4, parentTransform?: TransformComponent) {
    super(ComponentType.TRANSFORM)
    this.transformationMatrix = tranformationMatrix ?? mat4.identity()
    this.parent = parentTransform
  }

  toJson(): Object {
    return {
      type: this.type,
      name: this.name,
      tranformationMatrix: this.transformationMatrix,
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

export class CameraComponent extends Component {
  name?: string
  fov: number
  aspect?: number
  zNear: number
  zfar: number

  constructor(fov?: number, aspect?: number, zNear?: number, zFar?: number) {
    super(ComponentType.CAMERA)
    this.fov = fov ??= (2 * Math.PI) / 5
    this.aspect = aspect ??= 16 / 9
    this.zNear = zNear ??= 1
    this.zfar = zFar ??= 100
  }

  toJson(): Object {
    return {
      type: this.type,
      name: this.name,
      fov: this.fov,
      aspect: this.aspect,
      zNear: this.zNear,
      zFar: this.zfar,
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
