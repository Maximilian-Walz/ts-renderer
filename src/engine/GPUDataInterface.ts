import { mat4, vec4 } from 'wgpu-matrix'
import { BasicMaterial, GPUMaterial, Material, PbrMaterial } from './assets/Material'
import { TextureData } from './assets/loaders/TextureAssetLoader'
import { LightType, TransformComponent } from './components'
import { CameraData, GPUTextureData, LightData } from './systems/Renderer'

export class GPUDataInterface {
  private device: GPUDevice

  private smoothSampler: GPUSampler

  constructor(device: GPUDevice) {
    this.device = device
    this.smoothSampler = device.createSampler({
      addressModeU: 'repeat',
      addressModeV: 'repeat',
      magFilter: 'linear',
      minFilter: 'linear',
    })
    this.createStaticBindGroupLayouts()
  }

  private createStaticBindGroupLayouts() {
    // Materials
    BasicMaterial.bindGroupLayout = this.device.createBindGroupLayout(BasicMaterial.bindGroupLayoutDescriptor)
    PbrMaterial.bindGroupLayout = this.device.createBindGroupLayout(PbrMaterial.bindGroupLayoutDescriptor)
  }

  public createBuffer(buffer: Uint8Array, usage: GPUBufferUsageFlags) {
    const bufferLength = buffer.length + (4 - (buffer.length % 4))
    const gpuBuffer = this.device.createBuffer({
      size: bufferLength,
      usage: usage,
      mappedAtCreation: true,
    })
    new Uint8Array(gpuBuffer.getMappedRange()).set(buffer)
    gpuBuffer.unmap()
    return gpuBuffer
  }

  public createTexture(texture: TextureData, sampler?: SamplerData): GPUTextureData {
    const gpuTexture = this.device.createTexture({
      label: 'Asset texture',
      size: [texture.width, texture.height, 1],
      format: 'rgba8unorm',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
    })

    const gpuSampler = sampler
      ? this.device.createSampler({
          addressModeU: sampler.wrapS as GPUAddressMode,
          addressModeV: sampler.wrapT as GPUAddressMode,
          magFilter: sampler.magFilter as GPUFilterMode,
          minFilter: sampler.minFilter as GPUFilterMode,
          mipmapFilter: sampler.mipMapFilter as GPUFilterMode,
        })
      : this.smoothSampler

    this.device.queue.copyExternalImageToTexture({ source: texture }, { texture: gpuTexture }, [texture.width, texture.height])
    return {
      texture: gpuTexture,
      sampler: gpuSampler,
    }
  }

  public createPbrMaterial(material: PbrMaterial): GPUMaterial {
    // TODO: Insert binding for additional material info (normal factor, occlusion strength etc.)
    const bindGroup = this.device.createBindGroup({
      layout: material.getBindGroupLayout()!,
      entries: Array.of(material.albedoTexture, material.metallicRoughnessTexture, material.normalTexture, material.occlusionTexture, material.emissiveTexture).flatMap(
        (textureIdentifier, i) => {
          const textureData = textureIdentifier.textureData.getAssetData()
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
    return new GPUMaterial(bindGroup)
  }

  public createMaterials(materials: Material[]): GPUMaterial[] {
    const pbrMaterials = materials as PbrMaterial[] // TODO: support other materials
    return pbrMaterials.map((material) => {
      return this.createPbrMaterial(material)
    })
  }

  public writeTransformBuffers(transforms: TransformComponent[]) {
    transforms.forEach((transform) => {
      const modelMatrix = TransformComponent.calculateGlobalTransform(transform)
      const invModelMatrix = mat4.invert(modelMatrix)
      const normalModelMatrix = mat4.transpose(invModelMatrix)
      const matrices = new Float32Array([...modelMatrix, ...invModelMatrix, ...normalModelMatrix])
      this.device.queue.writeBuffer(transform.getOrCreateBindGroupData(this.device).buffer, 0, matrices.buffer, matrices.byteOffset, matrices.byteLength)
    })
  }

  public writeLightBuffers(lightsData: LightData[], activeCamerData: CameraData) {
    lightsData.forEach(({ transform, light }) => {
      const viewMatrix = TransformComponent.calculateGlobalTransform(transform)
      const invViewMatrix = mat4.invert(viewMatrix)

      let firstEntry
      switch (light.lightType) {
        case LightType.SUN:
          firstEntry = vec4.transformMat4(vec4.fromValues(0.0, 0.0, 1.0, 0.0), viewMatrix)
        default:
          firstEntry = vec4.transformMat4(vec4.fromValues(0.0, 0.0, 0.0, 1.0), viewMatrix)
          break
      }

      const cameraInvViewProjection = activeCamerData.camera.invViewProjection
      if (cameraInvViewProjection == undefined) {
        throw 'Camera projection needed for shadow map projection calculation. Compute camera matrices before light matrices.'
      }

      const viewProjectionMatrix = mat4.mul(light.getProjection(cameraInvViewProjection, invViewMatrix), invViewMatrix)
      const lightBaseData = new Float32Array([...firstEntry, ...viewProjectionMatrix, ...light.color, light.power])
      this.device.queue.writeBuffer(light.getOrCreateBindGroupData(this.device).buffer, 0, lightBaseData.buffer, lightBaseData.byteOffset, lightBaseData.byteLength)
    })
  }

  public writeCamraBuffers(cameraData: CameraData[], canvasWidth: number, canvasHeight: number) {
    cameraData.forEach(({ transform, camera }) => {
      const projectionMatrix = camera.getProjection(canvasWidth, canvasHeight)
      const viewMatrix = TransformComponent.calculateGlobalTransform(transform)
      const invViewMatrix = mat4.invert(viewMatrix)
      const viewProjectionMatrix = mat4.mul(projectionMatrix, invViewMatrix)
      const invProjectionMatrix = mat4.invert(projectionMatrix)
      const invViewProjectionMatrix = mat4.mul(viewMatrix, invProjectionMatrix)

      // Needed for shadow mapping projection
      camera.invViewProjection = invViewProjectionMatrix

      const cameraMatrices = new Float32Array([...viewProjectionMatrix, ...invViewProjectionMatrix, ...invViewMatrix, ...projectionMatrix])
      this.device.queue.writeBuffer(camera.getOrCreateBindGroupData(this.device).buffer, 0, cameraMatrices.buffer, cameraMatrices.byteOffset, cameraMatrices.byteLength)
    })
  }
}
