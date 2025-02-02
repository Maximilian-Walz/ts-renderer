import { AssetManager } from '../assets/AssetManager'
import { CameraComponent, LightComponent, MeshRendererComponent, TransformComponent } from '../components'
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

export type RenderData = {
  modelsData: ModelData[]
  lightsData: LightData[]
  camerasData: CameraData[]
  activeCameraData?: CameraData
}

export type GPUTextureData = {
  texture: GPUTexture
  sampler: GPUSampler
}

export class Renderer {
  private device: GPUDevice
  private gpuDataInterface: GPUDataInterface
  private assetManager: AssetManager
  private renderStrategy!: RenderStrategy

  private canvas!: HTMLCanvasElement
  private context!: GPUCanvasContext

  constructor(device: GPUDevice, assetManager: AssetManager, gpuDataInterface: GPUDataInterface) {
    this.device = device
    this.assetManager = assetManager
    this.gpuDataInterface = gpuDataInterface
  }

  public setRenderTarget(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext('webgpu')!
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
    })

    this.renderStrategy = new DeferredRenderer(this.device, this.context, this.assetManager)
  }

  public prepareScene({ modelsData, lightsData, camerasData }: RenderData) {
    this.gpuDataInterface.prepareTransforms(modelsData.map((model) => model.transform))
    this.gpuDataInterface.prepareTransforms(camerasData.map((camera) => camera.transform))
    this.gpuDataInterface.prepareTransforms(lightsData.map((light) => light.transform))
    this.gpuDataInterface.prepareCameras(camerasData)
    this.gpuDataInterface.prepareLights(lightsData)
  }

  public render(sceneData: RenderData) {
    const { modelsData, lightsData, camerasData, activeCameraData } = sceneData
    if (activeCameraData == undefined) {
      console.warn('Scene has no active camera.')
      return
    }

    const currentWidth = this.canvas.clientWidth
    const currentHeight = this.canvas.clientHeight
    if (currentWidth !== this.canvas.width || currentHeight !== this.canvas.height) {
      this.canvas.width = currentWidth
      this.canvas.height = currentHeight
    }

    this.gpuDataInterface.writeTransformBuffers(modelsData.map(({ transform }) => transform))
    this.gpuDataInterface.writeTransformBuffers(camerasData.map(({ transform }) => transform))
    this.gpuDataInterface.writeTransformBuffers(lightsData.map(({ transform }) => transform))
    this.gpuDataInterface.writeCamraBuffers(camerasData, currentWidth, currentHeight)
    this.gpuDataInterface.writeLightBuffers(lightsData, activeCameraData)

    this.renderStrategy.render(sceneData)
  }
}
