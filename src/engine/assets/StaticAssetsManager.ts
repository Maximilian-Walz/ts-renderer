import { GPUTextureData } from '../systems/Renderer'

export class StaticAssetManager {
  private texturesData: Map<string, GPUTextureData> = new Map()

  public getTextureData(identifier: string): GPUTextureData {
    if (!this.texturesData.has(identifier)) {
      throw `Texture with identifier "${identifier}" not found`
    }
    return this.texturesData.get(identifier)!
  }

  public async loadStaticAssets(device: GPUDevice) {
    const smoothSampler = device.createSampler({
      addressModeU: 'repeat',
      addressModeV: 'repeat',
      magFilter: 'linear',
      minFilter: 'linear',
    })

    const basicSampler = device.createSampler({
      addressModeU: 'repeat',
      addressModeV: 'repeat',
      magFilter: 'nearest',
      minFilter: 'nearest',
    })

    await this.loadTextureData('error', '/assets/textures/error.png', device, basicSampler)
    await this.loadTextureData('1x1_white', '/assets/textures/1x1_white.png', device, basicSampler)
    await this.loadTextureData('1x1_black', '/assets/textures/1x1_black.png', device, basicSampler)
    await this.loadTextureData('1x1_default_normal', '/assets/textures/1x1_default_normal.png', device, basicSampler)
    await this.loadTextureData('lightbulb', '/assets/textures/lightbulb.png', device, smoothSampler)
    await this.loadTextureData('sun', '/assets/textures/sun.png', device, smoothSampler)
  }

  private async loadTextureData(identifier: string, url: string, device: GPUDevice, sampler?: GPUSampler) {
    await this.loadImageBitmap(url).then((source) => {
      let textureData = {
        sampler: (sampler ??= device.createSampler({
          addressModeU: 'repeat',
          addressModeV: 'repeat',
          magFilter: 'linear',
          minFilter: 'linear',
        })),
        texture: device.createTexture({
          label: identifier,
          size: [source.width, source.height, 1],
          format: 'rgba8unorm',
          usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        }),
      }
      device.queue.copyExternalImageToTexture({ source: source }, { texture: textureData.texture }, [source.width, source.height])

      this.texturesData.set(identifier, textureData)
    })
  }

  private async loadImageBitmap(url: string): Promise<ImageBitmap> {
    const res = await fetch(url)
    const blob = await res.blob()
    return await createImageBitmap(blob, { colorSpaceConversion: 'none' })
  }
}
