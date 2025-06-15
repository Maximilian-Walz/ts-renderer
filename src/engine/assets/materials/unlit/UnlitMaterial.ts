import { Material, ShadingType } from '../Material'

export abstract class UnlitMaterial extends Material {
  constructor() {
    super(ShadingType.UNLIT)
  }

  public abstract getBindGroup(): GPUBindGroup
  public abstract getPipeline(): GPURenderPipeline
}
