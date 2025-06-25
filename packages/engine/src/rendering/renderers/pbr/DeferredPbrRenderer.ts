import { CameraComponent, ComponentType, LightComponent, LightType, ShadowMapComponent } from "../../../components"
import { ModelData, ShadowMapLightData } from "../../../systems/RendererSystem"

import deferredRenderingVert from "./deferredRendering.vert.wgsl"
import { GBuffer } from "./GBuffer"

import { ShadingType } from "../../../assets/materials/Material"
import { PbrMaterial } from "../../../assets/materials/pbr/PbrMaterial"
import { BufferDataComponentType, getBufferDataTypeByteCount } from "../../../assets/Mesh"
import { ShadowMapBindGroupData } from "../../bind-group-data/ShadowMapBindGroupData"
import { Renderer, RenderingData } from "../Renderer"
import ambientFrag from "./ambient.frag.wgsl"
import pointLightShading from "./pointLightShading.frag.wgsl"
import sunLightShading from "./sunLightShading.frag.wgsl"

export class DeferredPbrRenderer extends Renderer {
  private gBuffer: GBuffer
  private deferredSunLightRenderPipeline: GPURenderPipeline
  private ambientRenderPipeline: GPURenderPipeline

  private deferredPointLightRenderPipeline: GPURenderPipeline

  private defaultShadowMapData: ShadowMapBindGroupData

  constructor(device: GPUDevice, targetTextureFormat: GPUTextureFormat) {
    super(device)

    this.gBuffer = this.createGBuffer()
    this.defaultShadowMapData = new ShadowMapBindGroupData(device, 1)

    const deferredShadingVertexModule = this.device.createShaderModule({
      code: deferredRenderingVert,
    })

    this.ambientRenderPipeline = this.createAmbientRenderPipeline(targetTextureFormat, deferredShadingVertexModule)
    this.deferredSunLightRenderPipeline = this.createDeferredRenderPipeline(
      targetTextureFormat,
      [
        this.gBuffer.getBindGroupLayout(),
        CameraComponent.getBindGroupLayout(device),
        LightComponent.getBindGroupLayout(device),
        ShadowMapComponent.getBindGroupLayout(device),
      ],
      deferredShadingVertexModule,
      true
    )
    this.deferredPointLightRenderPipeline = this.createDeferredRenderPipeline(
      targetTextureFormat,
      [
        this.gBuffer.getBindGroupLayout(),
        CameraComponent.getBindGroupLayout(device),
        LightComponent.getBindGroupLayout(device),
        ShadowMapComponent.getBindGroupLayout(device),
      ],
      deferredShadingVertexModule,
      false
    )
  }

  private createGBuffer(): GBuffer {
    const gBuffer = new GBuffer(this.device)
    gBuffer.addTexture("normal", PbrMaterial.gBufferFormat.normal, [0.0, 0.0, 1.0, 1.0], "unfilterable-float")
    gBuffer.addTexture("albedo", PbrMaterial.gBufferFormat.albedo, [0.0, 0.0, 0.0, 1.0], "unfilterable-float")
    gBuffer.addTexture("orm", PbrMaterial.gBufferFormat.orm, [0.0, 0.0, 0.0, 1.0], "unfilterable-float")
    gBuffer.addTexture("emission", PbrMaterial.gBufferFormat.emission, [0.0, 0.0, 0.0, 1.0], "unfilterable-float")
    gBuffer.addTexture("depth", PbrMaterial.gBufferFormat.depth, 1.0, "depth")
    return gBuffer
  }

  private createWriteGBufferPassDescriptor(width: number, height: number): GPURenderPassDescriptor {
    this.gBuffer.createTextureViews(width, height)
    return {
      label: "Write GBuffer",
      colorAttachments: ["normal", "albedo", "orm", "emission"].map((textureName) =>
        this.gBuffer.getColorAttachment(textureName)
      ),
      depthStencilAttachment: this.gBuffer.getDepthAttachment(),
    }
  }

  private writeGBuffer(
    commandEncoder: GPUCommandEncoder,
    width: number,
    height: number,
    modelsData: ModelData[],
    camera: CameraComponent
  ): void {
    const gBufferPass = commandEncoder.beginRenderPass(this.createWriteGBufferPassDescriptor(width, height))
    gBufferPass.setBindGroup(0, camera.getOrCreateBindGroupData(this.device).bindGroup)

    modelsData.forEach(({ transform, meshRenderer }) => {
      gBufferPass.setBindGroup(1, transform.getOrCreateBindGroupData(this.device).bindGroup)
      meshRenderer.primitives.forEach(({ meshLoader, materialLoader }) => {
        const material = materialLoader.getAssetData() as PbrMaterial
        if (material.type != ShadingType.PBR) {
          return
        }

        gBufferPass.setPipeline(material.getPipeline())
        gBufferPass.setBindGroup(2, material.getBindGroup())

        const mesh = meshLoader.getAssetData()
        const type =
          mesh.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? "uint16" : "uint32"

        const indexBuffer = mesh.indexBufferAccessor.buffer.getAssetData()
        gBufferPass.setIndexBuffer(indexBuffer, type)
        material.getVertexDataMapping().forEach(({ type }, index) => {
          const accessor = mesh.vertexAttributes.get(type)!
          const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
          const buffer = accessor.buffer.getAssetData()
          gBufferPass.setVertexBuffer(index, buffer, accessor.offset, accessor.count * byteCount)
        })

        gBufferPass.drawIndexed(mesh.indexBufferAccessor.count)
      })
    })

    gBufferPass.end()
  }

  private createAmbientRenderPipeline(
    targetTextureFormat: GPUTextureFormat,
    deferredShadingVertexModule: GPUShaderModule
  ): GPURenderPipeline {
    return this.device.createRenderPipeline({
      label: "Ambient",
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.gBuffer.getBindGroupLayout()],
      }),
      vertex: {
        module: deferredShadingVertexModule,
      },
      fragment: {
        module: this.device.createShaderModule({
          code: ambientFrag,
        }),
        targets: [
          {
            format: targetTextureFormat,
            blend: {
              color: {
                srcFactor: "one",
                dstFactor: "one",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back",
      },
    })
  }

  private doAmbient(renderPass: GPURenderPassEncoder): void {
    renderPass.setPipeline(this.ambientRenderPipeline)
    renderPass.setBindGroup(0, this.gBuffer.getBindGroup())
    renderPass.draw(6)
  }

  private createDeferredRenderPipeline(
    targetTextureFormat: GPUTextureFormat,
    bindGroupLayouts: GPUBindGroupLayout[],
    deferredShadingVertexModule: GPUShaderModule,
    isSunLight: boolean
  ): GPURenderPipeline {
    return this.device.createRenderPipeline({
      label: isSunLight ? "Sun light shading" : "Point light shading",
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: bindGroupLayouts,
      }),
      vertex: {
        module: deferredShadingVertexModule,
      },
      fragment: {
        module: this.device.createShaderModule({
          code: isSunLight ? sunLightShading : pointLightShading,
        }),
        targets: [
          {
            format: targetTextureFormat,
            blend: {
              color: {
                srcFactor: "one",
                dstFactor: "one",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one",
              },
            },
          },
        ],
      },
      primitive: {
        topology: "triangle-list",
        cullMode: "back",
      },
    })
  }

  private createDeferredRenderPassDescriptor(targetView: GPUTextureView): GPURenderPassDescriptor {
    return {
      label: "Deferred Shading",
      colorAttachments: [
        {
          view: targetView,
          clearValue: [0, 0, 0, 1],
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    }
  }

  private doShadingForLightType(
    renderPass: GPURenderPassEncoder,
    pipeline: GPURenderPipeline,
    lightsData: ShadowMapLightData[],
    camera: CameraComponent
  ): void {
    renderPass.setPipeline(pipeline)
    renderPass.setBindGroup(0, this.gBuffer.getBindGroup())
    renderPass.setBindGroup(1, camera.getOrCreateBindGroupData(this.device).bindGroup)

    lightsData.forEach(({ light, shadowMap }) => {
      if (!light.castShadow) {
        renderPass.setBindGroup(2, light.getOrCreateBindGroupData(this.device).bindGroup)
        renderPass.setBindGroup(3, this.defaultShadowMapData.bindGroup)
        renderPass.draw(6)
      } else {
        if (shadowMap != undefined) {
          renderPass.setBindGroup(2, light.getOrCreateBindGroupData(this.device).bindGroup)
          renderPass.setBindGroup(3, shadowMap.getOrCreateBindGroupData(this.device).bindGroup)
          renderPass.draw(6)
        }
      }
    })
  }

  private doShading(
    commandEncoder: GPUCommandEncoder,
    targetView: GPUTextureView,
    lightsData: ShadowMapLightData[],
    camera: CameraComponent
  ): void {
    const deferredRenderingPass = commandEncoder.beginRenderPass(this.createDeferredRenderPassDescriptor(targetView))

    const pointLightsData = lightsData.filter(({ light }) => light.lightType == LightType.POINT)
    const sunLightsData = lightsData.filter(({ light }) => light.lightType == LightType.SUN)

    this.doAmbient(deferredRenderingPass)
    this.doShadingForLightType(deferredRenderingPass, this.deferredPointLightRenderPipeline, pointLightsData, camera)
    this.doShadingForLightType(deferredRenderingPass, this.deferredSunLightRenderPipeline, sunLightsData, camera)
    deferredRenderingPass.end()
  }

  public render(commandEncoder: GPUCommandEncoder, renderingData: RenderingData): RenderingData {
    const { target, width, height, scene, cameraId } = renderingData

    const modelsData = scene.getComponents([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as ModelData[]
    const lightsData = scene.getComponents([ComponentType.TRANSFORM, ComponentType.LIGHT]) as ShadowMapLightData[]
    const activeCamera = scene.getEntity(cameraId).getComponent(CameraComponent)

    this.writeGBuffer(commandEncoder, width, height, modelsData, activeCamera)
    this.doShading(commandEncoder, target, lightsData, activeCamera)

    renderingData.depth = this.gBuffer.getDepthAttachment().view
    return renderingData
  }
}
