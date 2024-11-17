import { AssetManager, BufferTarget } from '../assets/asset-manager'
import { CameraComponent, LightComponent, MeshRendererComponent, TransformComponent } from '../components/components'
import { BasicMaterial, PbrMaterial, TextureIdentifier } from '../material'
import { DeferredRenderer } from '../rendering/deferred/deferredRenderer'
import { RenderStrategy } from '../rendering/render-strategy'

export type CameraData = {
  transform: TransformComponent
  camera: CameraComponent
}

export type ModelData = {
  transform: TransformComponent
  meshRenderer: MeshRendererComponent
}

export type LightData = {
  transform: TransformComponent
  light: LightComponent
}

type GPUTextureData = {
  texture: GPUTexture
  sampler: GPUSampler
}

export class Renderer {
  private assetManager: AssetManager
  private renderStrategy: RenderStrategy
  private device!: GPUDevice
  private canvas!: HTMLCanvasElement

  // TODO: Create some sort of GPU abstractions that holds all the gpu data and has methods to upload them
  private gpuBuffers: GPUBuffer[] = []
  private gpuTextures: GPUTextureData[] = []
  private defaultTexture!: GPUTextureData
  private blackBitmap!: ImageBitmap

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager
    this.renderStrategy = new DeferredRenderer(assetManager)
    //this.renderStrategy = new ForwardRenderer(assetManager)
  }

  async init() {
    if (!navigator.gpu) {
      throw new Error('WebGPU not supported on this browser.')
    }
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
      throw new Error('No appropriate GPUAdapter found.')
    }

    this.device = await adapter.requestDevice()
    this.device.lost.then((info) => {
      console.error(`WebGPU device was lost: ${info.message}`)
      if (info.reason !== 'destroyed') {
        this.init()
      }
    })

    this.blackBitmap = await createImageBitmap(new ImageData(Uint8ClampedArray.from([0, 0, 0, 0]), 1, 1))

    BasicMaterial.bindGroupLayout = this.device.createBindGroupLayout(BasicMaterial.bindGroupLayoutDescriptor)
    PbrMaterial.bindGroupLayout = this.device.createBindGroupLayout(PbrMaterial.bindGroupLayoutDescriptor)
    this.renderStrategy.setRenderingDevice(this.device)
  }

  setRenderTarget(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const context = canvas.getContext('webgpu')!
    context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
    })
    this.renderStrategy.setRenderingContext(context)
  }

  prepareGpuBuffers() {
    this.assetManager.buffers.forEach((buffer, index) => {
      // TODO: Can I set less as default? Counter example: BoomBox
      let usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.VERTEX | GPUBufferUsage.INDEX
      if (buffer.target == BufferTarget.ARRAY_BUFFER) usage = GPUBufferUsage.VERTEX
      else if (buffer.target == BufferTarget.ELEMENT_ARRAY_BUFFER) usage = GPUBufferUsage.INDEX
      const bufferLength = buffer.data.length + (4 - (buffer.data.length % 4))
      this.gpuBuffers[index] = this.device.createBuffer({
        size: bufferLength,
        usage: usage,
        mappedAtCreation: true,
      })
      new Uint8Array(this.gpuBuffers[index].getMappedRange()).set(buffer.data)
      this.gpuBuffers[index].unmap()
    })
    this.renderStrategy.setBuffers(this.gpuBuffers)
    console.log('Buffers loaded:', this.gpuBuffers.length)
  }

  prepareGpuTextures() {
    this.defaultTexture = {
      sampler: this.device.createSampler({
        addressModeU: 'repeat',
        addressModeV: 'repeat',
      }),
      texture: this.device.createTexture({
        label: 'Default texture',
        size: [1, 1, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      }),
    }
    this.device.queue.copyExternalImageToTexture({ source: this.blackBitmap }, { texture: this.defaultTexture.texture }, [this.blackBitmap.width, this.blackBitmap.height])

    this.assetManager.textures.forEach((texture, index) => {
      const gpuTexture = this.device.createTexture({
        label: 'Asset texture',
        size: [texture.image.width, texture.image.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
      })

      const gpuSampler = texture.sampler
        ? this.device.createSampler({
            addressModeU: texture.sampler.wrapS as GPUAddressMode,
            addressModeV: texture.sampler.wrapT as GPUAddressMode,
            magFilter: texture.sampler.magFilter as GPUFilterMode,
            minFilter: texture.sampler.minFilter as GPUFilterMode,
            mipmapFilter: texture.sampler.mipMapFilter as GPUFilterMode,
          })
        : this.defaultTexture.sampler

      this.device.queue.copyExternalImageToTexture({ source: texture.image }, { texture: gpuTexture }, [texture.image.width, texture.image.height])
      this.gpuTextures[index] = {
        texture: gpuTexture,
        sampler: gpuSampler,
      }
    })
    console.log('Textures loaded:', this.gpuTextures.length)
  }

  prepareMeshRenderers(components: [TransformComponent, MeshRendererComponent][]) {
    components.forEach(([transform, meshRenderer]) => {
      meshRenderer.modelMatrixBuffer = this.device.createBuffer({
        size: transform.toMatrix().byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      meshRenderer.normalmatrixBuffer = this.device.createBuffer({
        size: meshRenderer.modelMatrixBuffer.size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      meshRenderer.bindGroup = this.device.createBindGroup({
        layout: this.device.createBindGroupLayout({
          label: 'MeshRenderer',
          entries: [
            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
          ],
        }),
        entries: [
          {
            binding: 0,
            resource: { buffer: meshRenderer.modelMatrixBuffer },
          },
          {
            binding: 1,
            resource: { buffer: meshRenderer.normalmatrixBuffer },
          },
        ],
      })
    })
    console.log('Models prepared for rendering:', components.length)
  }

  getTextureAndSampler(textureIdentifier?: TextureIdentifier): GPUTextureData {
    const textureId = textureIdentifier?.textureId
    return textureId != undefined ? this.gpuTextures[textureId] : this.defaultTexture
  }

  prepareMaterials() {
    this.assetManager.materials.forEach((material) => {
      if (material instanceof PbrMaterial) {
        let lastBinding = 0
        const bindingEntries: GPUBindGroupEntry[] = [] // TODO: Insert binding for additional material info (normal factor, occlusion strength etc.)
        Array.of(material.albedoTexture, material.metallicRoughnessTexture, material.normalTexture, material.occlusionTexture, material.emissiveTexture).forEach(
          (textureIdentifier) => {
            const textureData = this.getTextureAndSampler(textureIdentifier)
            bindingEntries.push({
              binding: lastBinding++,
              resource: textureData.texture.createView(),
            })
            bindingEntries.push({
              binding: lastBinding++,
              resource: textureData.sampler,
            })
          }
        )

        material.bindGroup = this.device.createBindGroup({
          layout: material.getBindGroupLayout()!,
          entries: bindingEntries,
        })
      } else if (material instanceof BasicMaterial) {
        throw Error('Basic material not implemented yet')
      }
    })
  }

  render(modelsData: ModelData[], lightsData: LightData[], cameraData: CameraData) {
    const currentWidth = this.canvas.clientWidth
    const currentHeight = this.canvas.clientHeight
    if (currentWidth !== this.canvas.width || currentHeight !== this.canvas.height) {
      this.canvas.width = currentWidth
      this.canvas.height = currentHeight
    }

    this.renderStrategy.render(modelsData, lightsData, cameraData)
  }
}
