import { GBufferFormat, Material, ShadingType } from '../Material'

export abstract class PbrMaterial extends Material {
  constructor() {
    super(ShadingType.PBR)
  }
  public static readonly gBufferFormat: GBufferFormat = {
    normal: 'rgba16float',
    albedo: 'bgra8unorm',
    orm: 'rgba16float',
    emission: 'rgba16float',
    depth: 'depth24plus',
  }

  public abstract getBindGroup(): GPUBindGroup
  public abstract getPipeline(): GPURenderPipeline
}
