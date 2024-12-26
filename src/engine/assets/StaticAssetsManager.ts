import { GPUTextureData } from '../systems/Renderer'

export class StaticAssetManager {
  private texturesData: Map<string, GPUTextureData> = new Map()

  public getTextureData(identifier: string): GPUTextureData {
    return this.texturesData.get(identifier)!
  }

  public async loadStaticAssets(device: GPUDevice) {
    await this.loadTextureData('lightbulb', '/assets/textures/lightbulb.png', device)
  }

  private async loadTextureData(identifier: string, url: string, device: GPUDevice) {
    await this.loadImageBitmap(url).then((source) => {
      let textureData = {
        sampler: device.createSampler({
          addressModeU: 'repeat',
          addressModeV: 'repeat',
          magFilter: 'linear',
          minFilter: 'linear',
        }),
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
