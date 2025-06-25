import {
  BillboardComponent,
  CameraComponent,
  ComponentType,
  LightComponent,
  MeshRendererComponent,
  ShadowMapComponent,
  TransformComponent,
} from "../components"
import { GPUDataInterface } from "../GPUDataInterface"
import { ObscuredBillboardRenderer } from "../rendering/renderers/billboards/ObscuredBillboardRenderer"
import { DeferredPbrRenderer } from "../rendering/renderers/pbr/DeferredPbrRenderer"
import { SunLightShadowMapper } from "../rendering/renderers/shadows/SunLightShadowMapper"
import { UnlitRenderer } from "../rendering/renderers/unlit/UnlitRenderer"
import { RenderingProcedure } from "../rendering/RenderingProcedure"
import { RenderingStage } from "../rendering/RenderingStage"
import { EntityId } from "../scenes/Entity"
import { Scene } from "../scenes/Scene"

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
  shadowMap?: ShadowMapComponent
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

export class RendererSystem {
  private device: GPUDevice
  private gpuDataInterface: GPUDataInterface

  private renderingProcedure: RenderingProcedure

  private canvas!: HTMLCanvasElement
  private context!: GPUCanvasContext

  constructor(device: GPUDevice, gpuDataInterface: GPUDataInterface) {
    this.device = device
    this.gpuDataInterface = gpuDataInterface

    const canvasFormat = navigator.gpu.getPreferredCanvasFormat()

    const shadowMapping = new RenderingStage(new SunLightShadowMapper(device))
    const pbr = new RenderingStage(new DeferredPbrRenderer(device, canvasFormat))
    const billboards = new RenderingStage(new ObscuredBillboardRenderer(device, canvasFormat))
    const unlit = new RenderingStage(new UnlitRenderer(device))

    this.renderingProcedure = new RenderingProcedure(device, [shadowMapping, pbr, billboards, unlit])
  }

  public setRenderTarget(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext("webgpu")!
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat(),
    })
  }

  public render(scene: Scene, cameraId: EntityId) {
    const currentWidth = this.canvas.clientWidth
    const currentHeight = this.canvas.clientHeight
    if (currentWidth !== this.canvas.width || currentHeight !== this.canvas.height) {
      this.canvas.width = currentWidth
      this.canvas.height = currentHeight
    }

    scene.getComponents([ComponentType.TRANSFORM]).forEach(({ transform }) => {
      this.gpuDataInterface.writeTransformBuffer(transform as TransformComponent)
    })

    scene.getComponents([ComponentType.TRANSFORM, ComponentType.CAMERA]).forEach(({ transform, camera }) => {
      this.gpuDataInterface.writeCameraBuffer(
        transform as TransformComponent,
        camera as CameraComponent,
        currentWidth,
        currentHeight
      )
    })

    const activeCamera = scene.getEntity(cameraId).getComponent(CameraComponent)
    scene.getComponents([ComponentType.TRANSFORM, ComponentType.LIGHT]).forEach(({ transform, light }) => {
      this.gpuDataInterface.writeLightBuffer(transform as TransformComponent, light as LightComponent, activeCamera)
    })

    this.renderingProcedure.execute(this.context, scene, cameraId)
  }
}
