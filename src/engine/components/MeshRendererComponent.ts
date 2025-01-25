import { Component, ComponentType } from '.'

export enum VertexAttributeType {
  POSITION = 'POSITION',
  NORMAL = 'NORMAL',
  TANGENT = 'TANGENT',
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

export const getBufferDataTypeByteCount = (bufferDataType: BufferDataType, componentType: BufferDataComponentType) => {
  let componentCount
  switch (bufferDataType) {
    case BufferDataType.SCALAR:
      componentCount = 1
      break
    case BufferDataType.VEC2:
      componentCount = 2
      break
    case BufferDataType.VEC3:
      componentCount = 3
      break
    case BufferDataType.VEC4:
      componentCount = 4
      break
    case BufferDataType.MAT2:
      componentCount = 4
      break
    case BufferDataType.MAT3:
      componentCount = 9
      break
    case BufferDataType.MAT4:
      componentCount = 16
      break
  }

  let componentSize
  switch (componentType) {
    case BufferDataComponentType.SIGNED_BYTE:
      componentSize = 1
      break
    case BufferDataComponentType.UNSIGNED_BYTE:
      componentSize = 1
      break
    case BufferDataComponentType.SIGNED_SHORT:
      componentSize = 2
      break
    case BufferDataComponentType.UNSIGNED_SHORT:
      componentSize = 2
      break
    case BufferDataComponentType.UNSIGNED_INT:
      componentSize = 4
      break
    case BufferDataComponentType.FLOAT:
      componentSize = 4
      break
  }
  return componentCount * componentSize
}

export type BufferAccessor = {
  bufferIndex: number
  offset: number
  componentType: BufferDataComponentType
  type: BufferDataType
  count: number
}

export type PrimitiveRenderData = {
  materialIndex?: number
  indexBufferAccessor: BufferAccessor
  vertexAttributes: Map<VertexAttributeType, BufferAccessor>
  mode: number | undefined
}

export class MeshRendererComponent extends Component {
  name?: string
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
