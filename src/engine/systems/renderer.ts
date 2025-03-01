import { BillboardComponent, CameraComponent, LightComponent, MeshRendererComponent, ShadowMapComponent, TransformComponent } from '../components'
import { GPUDataInterface } from '../GPUDataInterface'
import { DeferredRenderer } from '../rendering/deferred/DeferredRenderer'

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

export type GPUSpriteData = {}

export type BillboardsData = {
  transform: TransformComponent
  billboard: BillboardComponent
}

export type ShadowMapLightData = {
  transform: TransformComponent
  light: LightComponent
  shadowMap: ShadowMapComponent
}

export type RenderData = {
  modelsData: ModelData[]
  lightsData: LightData[]
  lightsWithShadowMap: ShadowMapLightData[]
  camerasData: CameraData[]
  billboardsData: BillboardsData[]
  activeCameraData: CameraData
}

export type GPUTextureData = {
  texture: GPUTexture
  sampler: GPUSampler
}

export class Renderer {
  private device: GPUDevice
  private gpuDataInterface: GPUDataInterface
  private deferredRenderer: DeferredRenderer

  private canvas!: HTMLCanvasElement
  private context!: GPUCanvasContext

  constructor(device: GPUDevice, gpuDataInterface: GPUDataInterface) {
    this.device = device
    this.gpuDataInterface = gpuDataInterface
    this.deferredRenderer = new DeferredRenderer(this.device, navigator.gpu.getPreferredCanvasFormat())
  }

  public setRenderTarget(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext('webgpu')!
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
    })
  }

  public render(sceneData: RenderData) {
    const currentWidth = this.canvas.clientWidth
    const currentHeight = this.canvas.clientHeight
    if (currentWidth !== this.canvas.width || currentHeight !== this.canvas.height) {
      this.canvas.width = currentWidth
      this.canvas.height = currentHeight
    }

    const { modelsData, lightsData, camerasData, billboardsData, activeCameraData } = sceneData
    this.gpuDataInterface.writeTransformBuffers(modelsData.map(({ transform }) => transform))
    this.gpuDataInterface.writeTransformBuffers(camerasData.map(({ transform }) => transform))
    this.gpuDataInterface.writeTransformBuffers(lightsData.map(({ transform }) => transform))
    this.gpuDataInterface.writeTransformBuffers(billboardsData.map(({ transform }) => transform))
    this.gpuDataInterface.writeCamraBuffers(camerasData, currentWidth, currentHeight)
    this.gpuDataInterface.writeLightBuffers(lightsData, activeCameraData)

    this.deferredRenderer.render(this.context.getCurrentTexture(), sceneData)
  }
}
