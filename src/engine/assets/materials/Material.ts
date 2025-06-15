import { TextureAssetLoader } from '../loaders/TextureAssetLoader'

import { VertexAttributeType } from '../Mesh'

export enum ShadingType {
  PBR = 'PBR',
  UNLIT = 'UNLIT',
}

export type VertexAttributeInfo = {
  type: VertexAttributeType
  stride: number
  format: GPUVertexFormat
}

export type GBufferFormat = {
  normal: GPUTextureFormat
  albedo: GPUTextureFormat
  orm: GPUTextureFormat
  emission: GPUTextureFormat
  depth: GPUTextureFormat
}

export interface MaterialCreator<T extends MaterialProps> {
  new (materialProps: T, device: GPUDevice): Material
}

export abstract class Material {
  public readonly type: ShadingType
  private static vertexDataMapping: VertexAttributeInfo[] = [
    {
      type: VertexAttributeType.POSITION,
      format: 'float32x3',
      stride: 12,
    },
    {
      type: VertexAttributeType.NORMAL,
      format: 'float32x3',
      stride: 12,
    },
    {
      type: VertexAttributeType.TANGENT,
      format: 'float32x4',
      stride: 16,
    },
    {
      type: VertexAttributeType.TEXCOORD_0,
      format: 'float32x2',
      stride: 8,
    },
  ]

  constructor(type: ShadingType) {
    this.type = type
  }

  public getVertexDataMapping() {
    return Material.vertexDataMapping
  }
}

export abstract class MaterialProps {
  public abstract destroyGpuData(): any
}

export type TextureIdentifier = {
  textureData: TextureAssetLoader
  texCoordId: number
}
