import { GPUTextureData } from '../../systems/Renderer'
import { BindGroupData } from './BindGroupData'

export class TextureBindGroupData extends BindGroupData {
  private static bindGroupLayout: GPUBindGroupLayout
  readonly textureData: GPUTextureData
  readonly textureView: GPUTextureView

  constructor(device: GPUDevice, textureData: GPUTextureData) {
    const textureView = textureData.texture.createView()
    const entries: GPUBindGroupEntry[] = [
      {
        binding: 0,
        resource: textureView,
      },
      {
        binding: 1,
        resource: textureData.sampler,
      },
    ]

    super(device, TextureBindGroupData.getLayout(device), entries)
    this.textureData = textureData
    this.textureView = textureView
  }

  public static override getLayout(device: GPUDevice): GPUBindGroupLayout {
    if (this.bindGroupLayout == undefined) {
      this.bindGroupLayout = device.createBindGroupLayout({
        label: 'TextureBindGroupData',
        entries: [
          {
            binding: 0,
            texture: {
              sampleType: 'float',
            },
            visibility: GPUShaderStage.FRAGMENT,
          },
          {
            binding: 1,
            sampler: {},
            visibility: GPUShaderStage.FRAGMENT,
          },
        ],
      })
    }
    return this.bindGroupLayout
  }
}
