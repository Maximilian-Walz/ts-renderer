import { mat4, vec4 } from 'wgpu-matrix'
import { BufferTarget, GltfAssetManager } from './assets/GltfAssetManager'
import { StaticAssetManager } from './assets/StaticAssetsManager'
import { CameraComponent, LightComponent, LightType, TransformComponent } from './components/components'
import { BasicMaterial, Material, PbrMaterial, TextureIdentifier } from './material'
import { CameraData, GPUTextureData, LightData } from './systems/Renderer'

export class GPUDataInterface {
  private device: GPUDevice
  private staticAssetManager: StaticAssetManager
  private gltfAssetManager: GltfAssetManager

  private gpuBuffers: GPUBuffer[] = []
  private gpuTextures: GPUTextureData[] = []

  constructor(device: GPUDevice, staticAssetManager: StaticAssetManager, gltfAssetManger: GltfAssetManager) {
    this.device = device
    this.staticAssetManager = staticAssetManager
    this.gltfAssetManager = gltfAssetManger
    this.createStaticBindGroupLayouts()
  }

  private createStaticBindGroupLayouts() {
    // Cameras
    CameraComponent.bindGroupLayout = this.device.createBindGroupLayout({
      label: 'Camera',
      entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }],
    })

    // Transforms
    TransformComponent.bindGroupLayout = this.device.createBindGroupLayout({
      label: 'Transform',
      entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }],
    })

    // Materials
    BasicMaterial.bindGroupLayout = this.device.createBindGroupLayout(BasicMaterial.bindGroupLayoutDescriptor)
    PbrMaterial.bindGroupLayout = this.device.createBindGroupLayout(PbrMaterial.bindGroupLayoutDescriptor)

    // Lights
    let lightBaseDataLayoutEntry = {
      binding: 0,
      visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
      buffer: {},
    }

    LightComponent.pointLightBindGroupLayout = this.device.createBindGroupLayout({
      label: 'Point light (casts no shadow)',
      entries: [lightBaseDataLayoutEntry],
    })

    LightComponent.sunLightBindGroupLayout = this.device.createBindGroupLayout({
      label: 'Sun light (casts shadow)',
      entries: [
        lightBaseDataLayoutEntry,
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'depth',
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          sampler: {
            type: 'comparison',
          },
        },
      ],
    })

    LightComponent.shadowMappingBindGroupLayout = this.device.createBindGroupLayout({
      label: 'Shadow mapping',
      entries: [lightBaseDataLayoutEntry],
    })
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
    console.log('Buffers loaded:', this.gpuBuffers.length)
  }

  public prepareGpuTextures() {
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
        : this.staticAssetManager.getTextureData('1x1_white').sampler

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
      transform.matricesBuffer = this.device.createBuffer({
        size: 64 * 3,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })

      transform.bindGroup = this.device.createBindGroup({
        layout: TransformComponent.bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: transform.matricesBuffer },
          },
        ],
      })
    })
  }

  private getTextureAndSampler(textureIdentifier: TextureIdentifier): GPUTextureData {
    const textureId = textureIdentifier.textureId
    if (typeof textureId == 'number' && textureId <= this.gpuTextures.length) {
      return this.gpuTextures[textureId]
    } else if (typeof textureId == 'string') {
      return this.staticAssetManager.getTextureData(textureId)
    } else {
      return this.staticAssetManager.getTextureData('error')
    }
  }

  private preparePbrMaterial(material: PbrMaterial) {
    // TODO: Insert binding for additional material info (normal factor, occlusion strength etc.)
    material.bindGroup = this.device.createBindGroup({
      layout: material.getBindGroupLayout()!,
      entries: Array.of(material.albedoTexture, material.metallicRoughnessTexture, material.normalTexture, material.occlusionTexture, material.emissiveTexture).flatMap(
        (textureIdentifier, i) => {
          const textureData = this.getTextureAndSampler(textureIdentifier!)
          return [
            {
              binding: 2 * i,
              resource: textureData.texture.createView(),
            },
            {
              binding: 2 * i + 1,
              resource: textureData.sampler,
            },
          ]
        }
      ),
    })
  }

  public prepareMaterials() {
    this.preparePbrMaterial(this.gltfAssetManager.defaultMaterial as PbrMaterial)

    this.gltfAssetManager.materials.forEach((material) => {
      if (material instanceof PbrMaterial) {
        this.preparePbrMaterial(material)
      } else if (material instanceof BasicMaterial) {
        throw Error('Basic material not implemented yet')
      }
    })
  }

  public prepareLights(lightsData: LightData[]) {
    lightsData.forEach(({ light }) => {
      light.buffer = this.device.createBuffer({
        size: 208,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        label: 'Light buffer',
      })

      let lightBaseDataEntry = {
        binding: 0,
        resource: {
          buffer: light.buffer,
        },
      }

      if (light.lightType == LightType.SUN && light.castsShadow) {
        light.shadowMap = this.device.createTexture({
          size: [2048, 2048, 1],
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
          format: 'depth32float',
        })

        light.shadingBindGroup = this.device.createBindGroup({
          layout: LightComponent.sunLightBindGroupLayout,
          entries: [
            lightBaseDataEntry,
            {
              binding: 1,
              resource: light.shadowMap.createView(),
            },
            {
              binding: 2,
              resource: this.device.createSampler({
                compare: 'less',
              }),
            },
          ],
        })

        light.shadowMappingBindGroup = this.device.createBindGroup({
          layout: LightComponent.shadowMappingBindGroupLayout,
          entries: [lightBaseDataEntry],
        })
      } else if (light.lightType == LightType.POINT) {
        light.shadingBindGroup = this.device.createBindGroup({
          layout: LightComponent.pointLightBindGroupLayout,
          entries: [lightBaseDataEntry],
        })
      }
    })
  }

  public prepareCameras(cameraData: CameraData[]) {
    cameraData.forEach(({ camera }) => {
      camera.matricesBuffer = this.device.createBuffer({
        size: 256,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      })
      camera.bindGroup = this.device.createBindGroup({
        layout: CameraComponent.bindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: { buffer: camera.matricesBuffer },
          },
        ],
      })
    })
  }

  public writeTransformBuffers(transforms: TransformComponent[]) {
    transforms.forEach((transform) => {
      const modelMatrix = TransformComponent.calculateGlobalTransform(transform)
      const invModelMatrix = mat4.invert(modelMatrix)
      const normalModelMatrix = mat4.transpose(invModelMatrix)
      const matrices = new Float32Array([...modelMatrix, ...invModelMatrix, ...normalModelMatrix])
      this.device.queue.writeBuffer(transform.matricesBuffer!, 0, matrices.buffer, matrices.byteOffset, matrices.byteLength)
    })
  }

  public writeLightBuffers(lightsData: LightData[], activeCamerData: CameraData) {
    lightsData.forEach(({ transform, light }) => {
      const viewMatrix = TransformComponent.calculateGlobalCameraTransform(transform)
      const invViewMatrix = mat4.inverse(viewMatrix)

      let firstEntry
      switch (light.lightType) {
        case LightType.SUN:
          firstEntry = vec4.transformMat4(vec4.fromValues(0.0, 0.0, 1.0, 0.0), invViewMatrix)
        default:
          firstEntry = vec4.transformMat4(vec4.fromValues(0.0, 0.0, 0.0, 1.0), invViewMatrix)
          break
      }

      const viewProjectionMatrix = mat4.multiply(light.getProjection(), viewMatrix)
      const lightBaseData = new Float32Array([...firstEntry, ...viewProjectionMatrix, ...light.color, light.power])
      this.device.queue.writeBuffer(light.buffer!, 0, lightBaseData.buffer, lightBaseData.byteOffset, lightBaseData.byteLength)
    })
  }

  public writeCamraBuffers(cameraData: CameraData[], canvasWidth: number, canvasHeight: number) {
    cameraData.forEach(({ transform, camera }) => {
      const projectionMatrix = camera.getProjection(canvasWidth, canvasHeight)
      const viewMatrix = TransformComponent.calculateGlobalCameraTransform(transform)
      const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix)

      this.device.queue.writeBuffer(camera.matricesBuffer!, 0, viewProjectionMatrix.buffer, viewProjectionMatrix.byteOffset, viewProjectionMatrix.byteLength)
      const cameraInvViewProj = mat4.invert(viewProjectionMatrix)
      this.device.queue.writeBuffer(camera.matricesBuffer!, 64, cameraInvViewProj.buffer, cameraInvViewProj.byteOffset, cameraInvViewProj.byteLength)
      this.device.queue.writeBuffer(camera.matricesBuffer!, 128, viewMatrix.buffer, viewMatrix.byteOffset, viewMatrix.byteLength)
      this.device.queue.writeBuffer(camera.matricesBuffer!, 192, projectionMatrix.buffer, projectionMatrix.byteOffset, projectionMatrix.byteLength)
    })
  }

  public getStaticTextureData(identifier: string) {
    return this.staticAssetManager.getTextureData(identifier)
  }

  public getBuffer(bufferIndex: number) {
    return this.gpuBuffers[bufferIndex]
  }

  public getMaterial(materialIndex?: number): Material {
    if (materialIndex == undefined || materialIndex >= this.gltfAssetManager.materials.length) {
      return this.gltfAssetManager.defaultMaterial
    }

    return this.gltfAssetManager.materials[materialIndex]
  }
}
