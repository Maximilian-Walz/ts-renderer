import { GPUTextureData } from '../../systems/RendererSystem'
import { BindGroupData } from './BindGroupData'

export class ShadowMapBindGroupData extends BindGroupData {
  private static bindGroupLayout: GPUBindGroupLayout
  private static shadowSampler: GPUSampler

  private _textureData: GPUTextureData
  private _textureView: GPUTextureView

  constructor(device: GPUDevice, size: number) {
    const shadowTextureData = ShadowMapBindGroupData.createTexture(device, size)
    const textureView = shadowTextureData.texture.createView()
    const entries = ShadowMapBindGroupData.createEntries(textureView, shadowTextureData.sampler)
    super(device, ShadowMapBindGroupData.getLayout(device), entries)

    this._textureData = shadowTextureData
    this._textureView = textureView
  }

  get textureData() {
    return this._textureData
  }

  get textureView() {
    return this._textureView
  }

  private static createTexture(device: GPUDevice, size: number): GPUTextureData {
    return {
      texture: device.createTexture({
        size: [size, size, 1],
        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        format: 'depth32float',
      }),
      sampler: ShadowMapBindGroupData.getSampler(device),
    }
  }

  private static getSampler(device: GPUDevice): GPUSampler {
    if (this.shadowSampler == undefined) {
      this.shadowSampler = device.createSampler({
        compare: 'less',
      })
    }
    return this.shadowSampler
  }

  public static createEntries(textureView: GPUTextureView, sampler: GPUSampler) {
    return [
      {
        binding: 0,
        resource: textureView,
      },
      {
        binding: 1,
        resource: sampler,
      },
    ]
  }

  public updateShadowMapSize(size: number) {
    this._textureData.texture.destroy()
    const shadowTextureData = ShadowMapBindGroupData.createTexture(this.device, size)
    const textureView = shadowTextureData.texture.createView()
    const entries = ShadowMapBindGroupData.createEntries(textureView, shadowTextureData.sampler)

    this._textureData = shadowTextureData
    this._textureView = textureView
    this.recreateBindGroup(entries)
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
