type GBufferTexture = {
  format: GPUTextureFormat
  clearValue?: GPUColor | number
  sampleType: GPUTextureSampleType
  texture?: GPUTexture
  textureView?: GPUTextureView
}

export class GBuffer {
  private device: GPUDevice

  private width = 0
  private height = 0
  private textureInfos: Map<string, GBufferTexture>
  private bindGroupLayout: GPUBindGroupLayout | undefined
  private bindGroup: GPUBindGroup | undefined

  constructor(device: GPUDevice) {
    this.device = device
    this.textureInfos = new Map()
  }

  getFormat(name: string): GPUTextureFormat {
    return this.textureInfos.get(name)!.format
  }

  addTexture(name: string, format: GPUTextureFormat, clearValue: GPUColor | number, sampleType: GPUTextureSampleType) {
    this.textureInfos.set(name, { format, clearValue, sampleType })
  }

  createTextureViews(width: number, height: number) {
    if (this.width != width || this.height != height) {
      this.width = width
      this.height = height
      this.textureInfos.forEach((textureInfo) => {
        textureInfo.texture?.destroy()
        textureInfo.texture = this.device.createTexture({
          size: [width, height],
          format: textureInfo.format,
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
        })
        textureInfo.textureView = textureInfo.texture.createView()
      })
      this.createBindGroup()
    }
  }

  getColorAttachment(name: string): GPURenderPassColorAttachment {
    const textureInfo = this.textureInfos.get(name)!
    return {
      view: textureInfo.textureView!,
      clearValue: textureInfo.clearValue as GPUColor,
      loadOp: 'clear',
      storeOp: 'store',
    }
  }

  getDepthAttachment(): GPURenderPassDepthStencilAttachment {
    const depthInfo = this.textureInfos.get('depth')!
    return {
      view: depthInfo.textureView!,
      depthClearValue: depthInfo.clearValue as number,
      depthLoadOp: 'clear',
      depthStoreOp: 'store',
    }
  }

  createBindGroupLayout() {
    const entries = Array.from(this.textureInfos.values()).map((textureInfo, index) => {
      return {
        binding: index,
        visibility: GPUShaderStage.FRAGMENT,
        texture: {
          sampleType: textureInfo.sampleType,
        },
      }
    })

    this.bindGroupLayout = this.device.createBindGroupLayout({
      entries: entries,
    })
  }

  getBindGroupLayout(): GPUBindGroupLayout {
    if (!this.bindGroupLayout) {
      this.createBindGroupLayout()
    }

    return this.bindGroupLayout!
  }

  createBindGroup() {
    const textureViews = Array.from(this.textureInfos.values()).map((textureInfo) => textureInfo.textureView!)

    this.bindGroup = this.device.createBindGroup({
      layout: this.getBindGroupLayout(),
      entries: textureViews.map((textureView, index) => {
        return {
          binding: index,
          resource: textureView,
        } as GPUBindGroupEntry
      }),
    })
  }

  getBindGroup(): GPUBindGroup {
    if (!this.bindGroup) {
      this.createBindGroup()
    }

    return this.bindGroup!
  }
}
