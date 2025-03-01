import { GPUTextureData } from '../../systems/Renderer'
import { BindGroupData } from './BindGroupData'

export class ShadowMapBindGroupData extends BindGroupData {
  private static bindGroupLayout: GPUBindGroupLayout
  private static shadowSampler: GPUSampler

  readonly textureData: GPUTextureData
  readonly textureView: GPUTextureView

  constructor(device: GPUDevice, size: number) {
    const shadowTextureData: GPUTextureData = {
      texture: device.createTexture({
        size: [size, size, 1],
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        format: 'depth32float',
      }),
      sampler: ShadowMapBindGroupData.getSampler(device),
    }

    const textureView = shadowTextureData.texture.createView()
    const entries: GPUBindGroupEntry[] = [
      {
        binding: 0,
        resource: textureView,
      },
      {
        binding: 1,
        resource: shadowTextureData.sampler,
      },
    ]

    super(device, ShadowMapBindGroupData.getLayout(device), entries)
    this.textureData = shadowTextureData
    this.textureView = textureView
  }

  private static getSampler(device: GPUDevice) {
    if (this.shadowSampler == undefined) {
      this.shadowSampler = device.createSampler({
        compare: 'less',
      })
    }
    return this.shadowSampler
  }

  public static override getLayout(device: GPUDevice): GPUBindGroupLayout {
    if (this.bindGroupLayout == undefined) {
      this.bindGroupLayout = device.createBindGroupLayout({
        label: 'ShadowMapBindGroupData',
        entries: [
          {
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            texture: {
              sampleType: 'depth',
            },
          },
          {
            binding: 1,
            visibility: GPUShaderStage.FRAGMENT,
            sampler: {
              type: 'comparison',
            },
          },
        ],
      })
    }
    return this.bindGroupLayout
  }
}
