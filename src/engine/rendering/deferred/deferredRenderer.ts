import { CameraComponent, LightComponent, LightType, ShadowMapComponent } from '../../components'
import { CameraData, LightData, ModelData, RenderData, ShadowMapLightData } from '../../systems/Renderer'

import { PbrMaterial } from '../../assets/Material'
import { ObscuredBillboardRenderer } from '../billboards/ObscuredBillboardRenderer'
import { ShadowMapper } from '../shadows/ShadowMapper'
import { SunLightShadowMapper } from '../shadows/SunLightShadowMapper'
import deferredRenderingVert from './deferredRendering.vert.wgsl'
import { GBuffer } from './GBuffer'

import { BufferDataComponentType, getBufferDataTypeByteCount, VertexAttributeType } from '../../assets/Mesh'
import { BufferBindGroupData } from '../bind-group-data/BufferBindGroupData'
import { ShadowMapBindGroupData } from '../bind-group-data/ShadowMapBindGroupData'
import ambientFrag from './ambient.frag.wgsl'
import pointLightShading from './pointLightShading.frag.wgsl'
import sunLightShading from './sunLightShading.frag.wgsl'
import writeGBufferFrag from './writeGBuffer.frag.wgsl'
import writeGBufferVert from './writeGBuffer.vert.wgsl'

type VertexAttributeInfo = {
  type: VertexAttributeType
  stride: number
  format: GPUVertexFormat
}

export class DeferredRenderer {
  private device: GPUDevice

  private shadowMapper: ShadowMapper
  private billboardRenderer: ObscuredBillboardRenderer

  private gBuffer: GBuffer
  private writeGBufferPipeline: GPURenderPipeline
  private deferredSunLightRenderPipeline: GPURenderPipeline
  private ambientRenderPipeline: GPURenderPipeline

  private deferredPointLightRenderPipeline: GPURenderPipeline

  private defaultShadowMapData: ShadowMapBindGroupData

  private static vertexDataMapping: VertexAttributeInfo[] = [
    {
      type: VertexAttributeType.POSITION,
      format: 'float32x3',
      stride: 12,
    },
    {
      type: VertexAttributeType.NORMAL,
      format: 'float32x3',
      stride: 12,
    },
    {
      type: VertexAttributeType.TANGENT,
      format: 'float32x4',
      stride: 16,
    },
    {
      type: VertexAttributeType.TEXCOORD_0,
      format: 'float32x2',
      stride: 8,
    },
  ]

  constructor(device: GPUDevice, targetTextureFormat: GPUTextureFormat) {
    this.device = device

    this.shadowMapper = new SunLightShadowMapper(device)
    this.billboardRenderer = new ObscuredBillboardRenderer(device, targetTextureFormat)
    this.gBuffer = this.createGBuffer()

    this.defaultShadowMapData = new ShadowMapBindGroupData(device, 1)

    const deferredShadingVertexModule = this.device.createShaderModule({
      code: deferredRenderingVert,
    })

    this.writeGBufferPipeline = this.createWriteGBufferPipeline()
    this.ambientRenderPipeline = this.createAmbientRenderPipeline(targetTextureFormat, deferredShadingVertexModule)
    this.deferredSunLightRenderPipeline = this.createDeferredRenderPipeline(
      targetTextureFormat,
      [this.gBuffer.getBindGroupLayout(), CameraComponent.getBindGroupLayout(device), LightComponent.getBindGroupLayout(device), ShadowMapComponent.getBindGroupLayout(device)],
      deferredShadingVertexModule,
      true
    )
    this.deferredPointLightRenderPipeline = this.createDeferredRenderPipeline(
      targetTextureFormat,
      [this.gBuffer.getBindGroupLayout(), CameraComponent.getBindGroupLayout(device), LightComponent.getBindGroupLayout(device), ShadowMapComponent.getBindGroupLayout(device)],
      deferredShadingVertexModule,
      false
    )
  }

  private createGBuffer(): GBuffer {
    const gBuffer = new GBuffer(this.device)
    gBuffer.addTexture('normal', 'rgba16float', [0.0, 0.0, 1.0, 1.0], 'unfilterable-float')
    gBuffer.addTexture('albedo', 'bgra8unorm', [0.0, 0.0, 0.0, 1.0], 'unfilterable-float')
    gBuffer.addTexture('orm', 'rgba16float', [0.0, 0.0, 0.0, 1.0], 'unfilterable-float')
    gBuffer.addTexture('emission', 'rgba16float', [0.0, 0.0, 0.0, 1.0], 'unfilterable-float')
    gBuffer.addTexture('depth', 'depth24plus', 1.0, 'depth')
    return gBuffer
  }

  private createWriteGBufferPipeline(): GPURenderPipeline {
    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [BufferBindGroupData.getLayout(this.device), BufferBindGroupData.getLayout(this.device), PbrMaterial.bindGroupLayout],
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: writeGBufferVert,
        }),
        buffers: DeferredRenderer.vertexDataMapping.map(({ format, stride }, index) => {
          return {
            arrayStride: stride,
            attributes: [
              {
                shaderLocation: index,
                offset: 0,
                format: format,
              },
            ],
          }
        }),
      },
      fragment: {
        module: this.device.createShaderModule({
          code: writeGBufferFrag,
        }),
        targets: ['normal', 'albedo', 'orm', 'emission'].map((textureName) => {
          return { format: this.gBuffer.getFormat(textureName) }
        }),
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: this.gBuffer.getFormat('depth'),
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
    })
  }

  private createWriteGBufferPassDescriptor(target: GPUTexture): GPURenderPassDescriptor {
    this.gBuffer.createTextureViews(target.width, target.height)
    return {
      label: 'Write GBuffer',
      colorAttachments: ['normal', 'albedo', 'orm', 'emission'].map((textureName) => this.gBuffer.getColorAttachment(textureName)),
      depthStencilAttachment: this.gBuffer.getDepthAttachment(),
    }
  }

  private writeGBuffer(commandEncoder: GPUCommandEncoder, target: GPUTexture, modelsData: ModelData[], cameraData: CameraData): void {
    const gBufferPass = commandEncoder.beginRenderPass(this.createWriteGBufferPassDescriptor(target))
    gBufferPass.setPipeline(this.writeGBufferPipeline)
    gBufferPass.setBindGroup(0, cameraData.camera.getOrCreateBindGroupData(this.device).bindGroup)

    modelsData.forEach(({ transform, meshRenderer }) => {
      gBufferPass.setBindGroup(1, transform.getOrCreateBindGroupData(this.device).bindGroup)
      meshRenderer.primitives.forEach(({ meshLoader, materialLoader }) => {
        const mesh = meshLoader.getAssetData()
        const type = mesh.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? 'uint16' : 'uint32'

        const indexBuffer = mesh.indexBufferAccessor.buffer.getAssetData()
        gBufferPass.setIndexBuffer(indexBuffer, type)
        DeferredRenderer.vertexDataMapping.forEach(({ type }, index) => {
          const accessor = mesh.vertexAttributes.get(type)!
          const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
          const buffer = accessor.buffer.getAssetData()
          gBufferPass.setVertexBuffer(index, buffer, accessor.offset, accessor.count * byteCount)
        })

        const material = materialLoader.getAssetData()
        gBufferPass.setBindGroup(2, material.bindGroup)

        gBufferPass.drawIndexed(mesh.indexBufferAccessor.count)
      })
    })

    gBufferPass.end()
  }

  private createAmbientRenderPipeline(targetTextureFormat: GPUTextureFormat, deferredShadingVertexModule: GPUShaderModule): GPURenderPipeline {
    return this.device.createRenderPipeline({
      label: 'Ambient',
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
                srcFactor: 'one',
                dstFactor: 'one',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one',
              },
            },
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
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
      label: isSunLight ? 'Sun light shading' : 'Point light shading',
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
                srcFactor: 'one',
                dstFactor: 'one',
              },
              alpha: {
                srcFactor: 'one',
                dstFactor: 'one',
              },
            },
          },
        ],
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
    })
  }

  private createDeferredRenderPassDescriptor(targetView: GPUTextureView): GPURenderPassDescriptor {
    return {
      label: 'Deferred Shading',
      colorAttachments: [
        {
          view: targetView,
          clearValue: [0, 0, 0, 1],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    }
  }

  private doShadingForLightType(
    renderPass: GPURenderPassEncoder,
    pipeline: GPURenderPipeline,
    lightsData: LightData[],
    shadowCastingLights: ShadowMapLightData[],
    cameraData: CameraData
  ): void {
    renderPass.setPipeline(pipeline)
    renderPass.setBindGroup(0, this.gBuffer.getBindGroup())
    renderPass.setBindGroup(1, cameraData.camera.getOrCreateBindGroupData(this.device).bindGroup)

    lightsData.forEach(({ light }) => {
      if (!light.castShadow) {
        renderPass.setBindGroup(2, light.getOrCreateBindGroupData(this.device).bindGroup)
        renderPass.setBindGroup(3, this.defaultShadowMapData.bindGroup)
        renderPass.draw(6)
      }
    })

    shadowCastingLights.forEach(({ light, shadowMap }) => {
      renderPass.setBindGroup(2, light.getOrCreateBindGroupData(this.device).bindGroup)
      renderPass.setBindGroup(3, shadowMap.getOrCreateBindGroupData(this.device).bindGroup)
      renderPass.draw(6)
    })
  }

  private doShading(
    commandEncoder: GPUCommandEncoder,
    targetView: GPUTextureView,
    lightsData: LightData[],
    shadowCastingLights: ShadowMapLightData[],
    cameraData: CameraData
  ): void {
    const deferredRenderingPass = commandEncoder.beginRenderPass(this.createDeferredRenderPassDescriptor(targetView))

    const pointLightsData = lightsData.filter(({ light }) => light.lightType == LightType.POINT)
    const sunLightsData = lightsData.filter(({ light }) => light.lightType == LightType.SUN)

    const shadowCastingPointLightsData = shadowCastingLights.filter(({ light }) => light.lightType == LightType.POINT)
    const shadowCastingSunLightsData = shadowCastingLights.filter(({ light }) => light.lightType == LightType.SUN)

    this.doAmbient(deferredRenderingPass)
    this.doShadingForLightType(deferredRenderingPass, this.deferredPointLightRenderPipeline, pointLightsData, shadowCastingPointLightsData, cameraData)
    this.doShadingForLightType(deferredRenderingPass, this.deferredSunLightRenderPipeline, sunLightsData, shadowCastingSunLightsData, cameraData)
    deferredRenderingPass.end()
  }

  public render(target: GPUTexture, { modelsData, lightsData, activeCameraData, billboardsData, lightsWithShadowMap }: RenderData): void {
    if (!activeCameraData) return
    const targetView = target.createView()
    const commandEncoder = this.device.createCommandEncoder()

    const shadowCastingLights = lightsWithShadowMap.filter(({ light }) => light.castShadow)
    shadowCastingLights.forEach((shadowMappingData) => this.shadowMapper.renderShadowMap(commandEncoder, modelsData, shadowMappingData, activeCameraData))
    this.writeGBuffer(commandEncoder, target, modelsData, activeCameraData)
    this.doShading(commandEncoder, targetView, lightsData, shadowCastingLights, activeCameraData)

    this.billboardRenderer.render(commandEncoder, this.gBuffer.getDepthAttachment().view, billboardsData, activeCameraData, targetView)

    this.device.queue.submit([commandEncoder.finish()])
  }
}
