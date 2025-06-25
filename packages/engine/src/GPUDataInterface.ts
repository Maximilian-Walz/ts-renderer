import { mat4, vec4 } from 'wgpu-matrix'
import { TextureData } from './assets/loaders/TextureAssetLoader'
import { Material, MaterialCreator, MaterialProps } from './assets/materials/Material'
import { CameraComponent, LightComponent, LightType, TransformComponent } from './components'
import { GPUTextureData } from './systems/RendererSystem'

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

  public createMaterial<T extends MaterialProps>(MaterialCreator: MaterialCreator<T>, materialProps: T): Material {
    return new MaterialCreator(materialProps, this.device)
  }

  public writeTransformBuffer(transform: TransformComponent) {
    const modelMatrix = transform.globalTransform
    const invModelMatrix = mat4.invert(modelMatrix)
    const normalModelMatrix = mat4.transpose(invModelMatrix)
    const matrices = new Float32Array([...modelMatrix, ...invModelMatrix, ...normalModelMatrix])
    this.device.queue.writeBuffer(transform.getOrCreateBindGroupData(this.device).buffer, 0, matrices.buffer, matrices.byteOffset, matrices.byteLength)
  }

  public writeLightBuffer(transform: TransformComponent, light: LightComponent, activeCamera: CameraComponent) {
    const viewMatrix = transform.globalTransform
    const invViewMatrix = mat4.invert(viewMatrix)
    let firstEntry
    switch (light.lightType) {
      case LightType.SUN:
        firstEntry = vec4.transformMat4(vec4.fromValues(0.0, 0.0, 1.0, 0.0), viewMatrix)
      default:
        firstEntry = vec4.transformMat4(vec4.fromValues(0.0, 0.0, 0.0, 1.0), viewMatrix)
        break
    }

    const cameraInvViewProjection = activeCamera.invViewProjection
    if (cameraInvViewProjection == undefined) {
      throw 'Camera projection needed for shadow map projection calculation. Compute camera matrices before light matrices.'
    }

    const viewProjectionMatrix = mat4.mul(light.getProjection(cameraInvViewProjection, invViewMatrix), invViewMatrix)
    const lightBaseData = new Float32Array([...firstEntry, ...viewProjectionMatrix, ...light.color, light.power])
    this.device.queue.writeBuffer(light.getOrCreateBindGroupData(this.device).buffer, 0, lightBaseData.buffer, lightBaseData.byteOffset, lightBaseData.byteLength)
  }

  public writeCameraBuffer(transform: TransformComponent, camera: CameraComponent, canvasWidth: number, canvasHeight: number) {
    const projectionMatrix = camera.getProjection(canvasWidth, canvasHeight)
    const viewMatrix = transform.globalTransform
    const invViewMatrix = mat4.invert(viewMatrix)
    const viewProjectionMatrix = mat4.mul(projectionMatrix, invViewMatrix)
    const invProjectionMatrix = mat4.invert(projectionMatrix)
    const invViewProjectionMatrix = mat4.mul(viewMatrix, invProjectionMatrix)

    // Needed for shadow mapping projection
    camera.invViewProjection = invViewProjectionMatrix

    const cameraMatrices = new Float32Array([...viewProjectionMatrix, ...invViewProjectionMatrix, ...invViewMatrix, ...projectionMatrix])
    this.device.queue.writeBuffer(camera.getOrCreateBindGroupData(this.device).buffer, 0, cameraMatrices.buffer, cameraMatrices.byteOffset, cameraMatrices.byteLength)
  }
}
