import { BillboardComponent, CameraComponent, LightComponent, MeshRendererComponent, TransformComponent } from '../components'
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

export type BillboardsData = {
  transform: TransformComponent
  billboard: BillboardComponent
}

export type RenderData = {
  modelsData: ModelData[]
  lightsData: LightData[]
  camerasData: CameraData[]
  billboardsData: BillboardsData[]
  activeCameraData?: CameraData
}

export type GPUTextureData = {
  texture: GPUTexture
  sampler: GPUSampler
}

export class Renderer {
  private device: GPUDevice
  private gpuDataInterface: GPUDataInterface
  private renderStrategy!: RenderStrategy

  private canvas!: HTMLCanvasElement
  private context!: GPUCanvasContext

  constructor(device: GPUDevice, gpuDataInterface: GPUDataInterface) {
    this.device = device
    this.gpuDataInterface = gpuDataInterface
  }

  public setRenderTarget(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext('webgpu')!
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
    })

    this.renderStrategy = new DeferredRenderer(this.device, this.context)
  }

  public prepareScene({ modelsData, lightsData, camerasData, billboardsData }: RenderData) {
    this.gpuDataInterface.prepareTransforms(modelsData.map(({ transform }) => transform))

    this.gpuDataInterface.prepareTransforms(camerasData.map(({ transform }) => transform))
    this.gpuDataInterface.prepareCameras(camerasData)

    this.gpuDataInterface.prepareTransforms(lightsData.map(({ transform }) => transform))
    this.gpuDataInterface.prepareLights(lightsData)

    this.gpuDataInterface.prepareTransforms(billboardsData.map(({ transform }) => transform))
    this.gpuDataInterface.prepareBillboards(billboardsData.map(({ billboard }) => billboard))
  }

  public render(sceneData: RenderData) {
    const { modelsData, lightsData, camerasData, billboardsData, activeCameraData } = sceneData
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
    this.gpuDataInterface.writeTransformBuffers(billboardsData.map(({ transform }) => transform))
    this.gpuDataInterface.writeCamraBuffers(camerasData, currentWidth, currentHeight)
    this.gpuDataInterface.writeLightBuffers(lightsData, activeCameraData)

    this.renderStrategy.render(sceneData)
  }
}
