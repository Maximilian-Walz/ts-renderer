import { BufferDataComponentType, CameraComponent, LightComponent, LightType, TransformComponent, VertexAttributeType, getBufferDataTypeByteCount } from '../../components'
import { CameraData, LightData, ModelData, SceneData } from '../../systems/Renderer'
import { RenderStrategy } from '../RenderStrategy'

import { PbrMaterial } from '../../material'
import { DebugRenderer } from '../debug/DebugRenderer'
import { ShadowMapper } from '../shadows/ShadowMapper'
import { SunLightShadowMapper } from '../shadows/SunLightShadowMapper'
import deferredRenderingVert from './deferredRendering.vert.wgsl'
import { GBuffer } from './GBuffer'

import { AssetManager } from '../../assets/AssetManager'
import { GPUDataInterface } from '../../GPUDataInterface'
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

export class DeferredRenderer implements RenderStrategy {
  private device: GPUDevice
  private context: GPUCanvasContext

  private shadowMapper: ShadowMapper
  private debugRenderer: DebugRenderer

  private gBuffer: GBuffer
  private writeGBufferPipeline: GPURenderPipeline
  private deferredSunLightRenderPipeline: GPURenderPipeline
  private ambientRenderPipeline: GPURenderPipeline
  private deferredPointLightRenderPipeline: GPURenderPipeline

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

  constructor(device: GPUDevice, context: GPUCanvasContext, gpuDataInterface: GPUDataInterface, assetManager: AssetManager) {
    this.device = device
    this.context = context

    this.shadowMapper = new SunLightShadowMapper(device, gpuDataInterface)
    this.debugRenderer = new DebugRenderer(device, context, assetManager)
    this.gBuffer = this.createGBuffer()

    const deferredShadingVertexModule = this.device.createShaderModule({
      code: deferredRenderingVert,
    })

    this.writeGBufferPipeline = this.createWriteGBufferPipeline()
    this.ambientRenderPipeline = this.createAmbientRenderPipeline(deferredShadingVertexModule)
    this.deferredSunLightRenderPipeline = this.createDeferredRenderPipeline(
      [this.gBuffer.getBindGroupLayout(), TransformComponent.bindGroupLayout, LightComponent.sunLightBindGroupLayout],
      deferredShadingVertexModule,
      true
    )
    this.deferredPointLightRenderPipeline = this.createDeferredRenderPipeline(
      [this.gBuffer.getBindGroupLayout(), TransformComponent.bindGroupLayout, LightComponent.pointLightBindGroupLayout],
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
        bindGroupLayouts: [CameraComponent.bindGroupLayout, TransformComponent.bindGroupLayout, PbrMaterial.bindGroupLayout],
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

  private writeGBuffer(commandEncoder: GPUCommandEncoder, modelsData: ModelData[], cameraData: CameraData): void {
    const target = this.context.getCurrentTexture()
    const gBufferPass = commandEncoder.beginRenderPass(this.createWriteGBufferPassDescriptor(target))
    gBufferPass.setPipeline(this.writeGBufferPipeline)
    gBufferPass.setBindGroup(0, cameraData.camera.bindGroup!)

    modelsData.forEach(({ transform, meshRenderer }) => {
      if (transform.matricesBuffer == undefined) {
        return
      }
      gBufferPass.setBindGroup(1, transform.bindGroup!)
      meshRenderer.primitives.forEach((primitiveRenderData) => {
        const type = primitiveRenderData.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? 'uint16' : 'uint32'
        gBufferPass.setIndexBuffer(primitiveRenderData.indexBufferAccessor.buffer, type)
        DeferredRenderer.vertexDataMapping.forEach(({ type }, index) => {
          const accessor = primitiveRenderData.vertexAttributes.get(type)!
          const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
          gBufferPass.setVertexBuffer(index, accessor.buffer, accessor.offset, accessor.count * byteCount)
        })

        const material = primitiveRenderData.material
        gBufferPass.setBindGroup(2, material.bindGroup)

        gBufferPass.drawIndexed(primitiveRenderData.indexBufferAccessor.count)
      })
    })

    gBufferPass.end()
  }

  private createAmbientRenderPipeline(deferredShadingVertexModule: GPUShaderModule): GPURenderPipeline {
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
            format: this.context.getCurrentTexture().format,
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

  private createDeferredRenderPipeline(bindGroupLayouts: GPUBindGroupLayout[], deferredShadingVertexModule: GPUShaderModule, isSunLight: boolean): GPURenderPipeline {
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
            format: this.context.getCurrentTexture().format,
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

  private createDeferredRenderPassDescriptor(): GPURenderPassDescriptor {
    return {
      label: 'Deferred Shading',
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: [0, 0, 0, 1],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    }
  }

  private doShadingForLightType(renderPass: GPURenderPassEncoder, pipeline: GPURenderPipeline, lightsData: LightData[], cameraData: CameraData): void {
    renderPass.setPipeline(pipeline)
    renderPass.setBindGroup(0, this.gBuffer.getBindGroup())
    // reuse scene bind group for now
    renderPass.setBindGroup(1, cameraData.camera.bindGroup!)

    lightsData.forEach(({ light }) => {
      renderPass.setBindGroup(2, light.shadingBindGroup!)
      renderPass.draw(6)
    })
  }

  private doShading(commandEncoder: GPUCommandEncoder, lightsData: LightData[], cameraData: CameraData): void {
    const deferredRenderingPass = commandEncoder.beginRenderPass(this.createDeferredRenderPassDescriptor())

    const pointLightsData = lightsData.filter((lightData) => lightData.light.lightType == LightType.POINT)
    const sunLightsData = lightsData.filter((lightData) => lightData.light.lightType == LightType.SUN)

    // For now, sun light <=> has shadow map
    this.doAmbient(deferredRenderingPass)
    this.doShadingForLightType(deferredRenderingPass, this.deferredPointLightRenderPipeline, pointLightsData, cameraData)
    this.doShadingForLightType(deferredRenderingPass, this.deferredSunLightRenderPipeline, sunLightsData, cameraData)
    deferredRenderingPass.end()
  }

  public render({ modelsData, lightsData, camerasData, activeCameraData }: SceneData): void {
    if (!activeCameraData) return

    const commandEncoder = this.device.createCommandEncoder()

    lightsData.filter(({ light }) => light.castsShadow).forEach((lightData) => this.shadowMapper.renderShadowMap(commandEncoder, modelsData, lightData, activeCameraData))
    this.writeGBuffer(commandEncoder, modelsData, activeCameraData)
    this.doShading(commandEncoder, lightsData, activeCameraData)

    this.debugRenderer.renderDebugOverlay(commandEncoder, this.gBuffer.getDepthAttachment().view, lightsData, camerasData, activeCameraData)

    this.device.queue.submit([commandEncoder.finish()])
  }
}
