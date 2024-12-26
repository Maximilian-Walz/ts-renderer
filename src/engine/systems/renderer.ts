import { mat4 } from 'wgpu-matrix'
import { BufferTarget, GltfAssetManager } from '../assets/GltfAssetManager'
import { StaticAssetManager } from '../assets/StaticAssetsManager'
import { CameraComponent, LightComponent, MeshRendererComponent, TransformComponent } from '../components/components'
import { BasicMaterial, PbrMaterial, TextureIdentifier } from '../material'
import { DeferredRenderer } from '../rendering/deferred/DeferredRenderer'
import { RenderStrategy } from '../rendering/RenderStrategy'

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

export type GPUTextureData = {
  texture: GPUTexture
  sampler: GPUSampler
}

export class Renderer {
  private gltfAssetManager: GltfAssetManager
  private staticAssetManager: StaticAssetManager
  private renderStrategy: RenderStrategy
  private device!: GPUDevice
  private canvas!: HTMLCanvasElement
  private context!: GPUCanvasContext

  // TODO: Create some sort of GPU abstractions that holds all the gpu data and has methods to upload them
  private gpuBuffers: GPUBuffer[] = []
  private gpuTextures: GPUTextureData[] = []
  private defaultTexture!: GPUTextureData
  private blackBitmap!: ImageBitmap

  constructor(gltfAssetManager: GltfAssetManager, staticAssetManager: StaticAssetManager) {
    this.gltfAssetManager = gltfAssetManager
    this.staticAssetManager = staticAssetManager
    this.renderStrategy = new DeferredRenderer(gltfAssetManager, staticAssetManager)
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

    await this.staticAssetManager.loadStaticAssets(this.device)

    this.blackBitmap = await createImageBitmap(new ImageData(Uint8ClampedArray.from([0, 0, 0, 0]), 1, 1))

    BasicMaterial.bindGroupLayout = this.device.createBindGroupLayout(BasicMaterial.bindGroupLayoutDescriptor)
    PbrMaterial.bindGroupLayout = this.device.createBindGroupLayout(PbrMaterial.bindGroupLayoutDescriptor)
    this.renderStrategy.setRenderingDevice(this.device)
  }

  public setRenderTarget(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext('webgpu')!
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
    })
    this.renderStrategy.setRenderingContext(this.context)
  }

  public prepareGpuBuffers() {
    this.gltfAssetManager.buffers.forEach((buffer, index) => {
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

  public prepareGpuTextures() {
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

    this.gltfAssetManager.textures.forEach((texture, index) => {
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

  public prepareTransforms(transforms: TransformComponent[]) {
    transforms.forEach((transform) => {
      transform.modelMatrixBuffer = this.device.createBuffer({
        size: transform.toMatrix().byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      transform.normalmatrixBuffer = this.device.createBuffer({
        size: transform.modelMatrixBuffer.size,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      transform.bindGroup = this.device.createBindGroup({
        layout: this.device.createBindGroupLayout({
          label: 'Transform',
          entries: [
            { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
            { binding: 1, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} },
          ],
        }),
        entries: [
          {
            binding: 0,
            resource: { buffer: transform.modelMatrixBuffer },
          },
          {
            binding: 1,
            resource: { buffer: transform.normalmatrixBuffer },
          },
        ],
      })
    })
  }

  private getTextureAndSampler(textureIdentifier?: TextureIdentifier): GPUTextureData {
    const textureId = textureIdentifier?.textureId
    return textureId != undefined ? this.gpuTextures[textureId] : this.defaultTexture
  }

  public prepareMaterials() {
    this.gltfAssetManager.materials.forEach((material) => {
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

  public prepareShadowMaps(lightData: LightData[]) {
    lightData
      .filter((lightDatum) => lightDatum.light.castsShadow)
      .forEach((lightDatum) => {
        lightDatum.light.shadowMap = this.device.createTexture({
          size: [200, 200, 1],
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
          format: 'depth32float',
        })
      })
  }

  public prepareCameras(cameraData: CameraData[]) {
    cameraData.forEach(({ transform, camera }) => {
      camera.viewProjectionsBuffer = this.device.createBuffer({
        size: 256,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      camera.bindGroupLayout = this.device.createBindGroupLayout({
        label: 'Camera',
        entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }],
      })
      camera.bindGroup = this.device.createBindGroup({
        layout: camera.bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: camera.viewProjectionsBuffer },
          },
        ],
      })
    })
  }

  public writeTransformBuffers(transforms: TransformComponent[]) {
    transforms.forEach((transform) => {
      const modelMatrix = TransformComponent.calculateGlobalTransform(transform)
      this.device.queue.writeBuffer(transform.modelMatrixBuffer!, 0, modelMatrix.buffer, modelMatrix.byteOffset, modelMatrix.byteLength)

      const normalMatrix = mat4.invert(modelMatrix)
      mat4.transpose(normalMatrix, normalMatrix)
      this.device.queue.writeBuffer(transform.normalmatrixBuffer!, 0, normalMatrix.buffer, normalMatrix.byteOffset, normalMatrix.byteLength)
    })
  }

  public writeCamraBuffers(cameraData: CameraData[]) {
    cameraData.forEach(({ transform, camera }) => {
      const projectionMatrix = camera.getProjection(this.canvas.clientWidth, this.canvas.clientHeight)
      const viewMatrix = TransformComponent.calculateGlobalCameraTransform(transform)
      const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix)

      this.device.queue.writeBuffer(camera.viewProjectionsBuffer!, 0, viewProjectionMatrix.buffer, viewProjectionMatrix.byteOffset, viewProjectionMatrix.byteLength)
      const cameraInvViewProj = mat4.invert(viewProjectionMatrix)
      this.device.queue.writeBuffer(camera.viewProjectionsBuffer!, 64, cameraInvViewProj.buffer, cameraInvViewProj.byteOffset, cameraInvViewProj.byteLength)
      this.device.queue.writeBuffer(camera.viewProjectionsBuffer!, 128, viewMatrix.buffer, viewMatrix.byteOffset, viewMatrix.byteLength)
      this.device.queue.writeBuffer(camera.viewProjectionsBuffer!, 192, projectionMatrix.buffer, projectionMatrix.byteOffset, projectionMatrix.byteLength)
    })
  }

  public render(modelsData: ModelData[], lightsData: LightData[], cameraData: CameraData) {
    const currentWidth = this.canvas.clientWidth
    const currentHeight = this.canvas.clientHeight
    if (currentWidth !== this.canvas.width || currentHeight !== this.canvas.height) {
      this.canvas.width = currentWidth
      this.canvas.height = currentHeight
    }

    this.renderStrategy.render(modelsData, lightsData, cameraData)
  }
}
