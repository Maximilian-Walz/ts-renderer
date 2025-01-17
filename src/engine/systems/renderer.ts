import { GltfAssetManager } from '../assets/GltfAssetManager'
import { StaticAssetManager } from '../assets/StaticAssetsManager'
import { CameraComponent, LightComponent, MeshRendererComponent, TransformComponent } from '../components/components'
import { GPUDataInterface } from '../GPUDataInterface'
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
  private device!: GPUDevice
  private renderStrategy!: RenderStrategy
  private gpuDataInterface!: GPUDataInterface

  private canvas!: HTMLCanvasElement
  private context!: GPUCanvasContext

  async init(gltfAssetManager: GltfAssetManager, staticAssetManager: StaticAssetManager) {
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
        this.init(gltfAssetManager, staticAssetManager)
      }
    })

    await staticAssetManager.loadStaticAssets(this.device)
    this.gpuDataInterface = new GPUDataInterface(this.device, staticAssetManager, gltfAssetManager)
  }

  public setRenderTarget(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext('webgpu')!
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
    })

    this.renderStrategy = new DeferredRenderer(this.device, this.gpuDataInterface, this.context)
  }

  public prepareGpuBuffers() {
    this.gpuDataInterface.prepareGpuBuffers()
  }

  public prepareGpuTextures() {
    this.gpuDataInterface.prepareGpuTextures()
  }

  public prepareTransforms(transforms: TransformComponent[]) {
    this.gpuDataInterface.prepareTransforms(transforms)
  }

  public prepareMaterials() {
    this.gpuDataInterface.prepareMaterials()
  }

  public prepareLights(lightData: LightData[]) {
    this.gpuDataInterface.prepareLights(lightData)
  }

  public prepareCameras(cameraData: CameraData[]) {
    this.gpuDataInterface.prepareCameras(cameraData)
  }

  public writeTransformBuffers(transforms: TransformComponent[]) {
    this.gpuDataInterface.writeTransformBuffers(transforms)
  }

  public writeLightBuffers(lightData: LightData[]) {
    this.gpuDataInterface.writeLightBuffers(lightData)
  }

  public writeCamraBuffers(cameraData: CameraData[]) {
    this.gpuDataInterface.writeCamraBuffers(cameraData, this.canvas.clientWidth, this.canvas.clientHeight)
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
