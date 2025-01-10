import { BufferDataComponentType, VertexAttributeType, getBufferDataTypeByteCount } from '../../components/components'
import { CameraData, LightData, ModelData } from '../../systems/Renderer'
import { RenderStrategy } from '../RenderStrategy'

import { GPUDataInterface } from '../../GPUDataInterface'
import { PbrMaterial } from '../../material'
import { DebugRenderer } from '../debug/DebugRenderer'
import { ShadowMapper } from '../shadows/ShadowMapper'
import { SunLightShadowMapper } from '../shadows/SunLightShadowMapper'
import deferredRenderingFrag from './deferredRendering.frag.wgsl'
import deferredRenderingVert from './deferredRendering.vert.wgsl'
import { GBuffer } from './GBuffer'
import writeGBufferFrag from './writeGBuffer.frag.wgsl'
import writeGBufferVert from './writeGBuffer.vert.wgsl'

export class DeferredRenderer implements RenderStrategy {
  private device: GPUDevice
  private gpuDataInterface: GPUDataInterface
  private context: GPUCanvasContext

  private shadowMapper: ShadowMapper
  private debugRenderer: DebugRenderer

  private lightsBuffer: GPUBuffer
  private lightsBindGroup: GPUBindGroup

  private gBuffer: GBuffer
  private writeGBufferPipeline: GPURenderPipeline
  private deferredRenderPipeline: GPURenderPipeline

  constructor(device: GPUDevice, gpuDataInterface: GPUDataInterface, context: GPUCanvasContext) {
    this.device = device
    this.gpuDataInterface = gpuDataInterface
    this.context = context

    this.shadowMapper = new SunLightShadowMapper(device, gpuDataInterface)
    this.debugRenderer = new DebugRenderer(this.device, this.context, this.gpuDataInterface)
    this.gBuffer = this.createGBuffer()

    const sceneBindGroupLayout = this.createSceneBindGroupLayout()
    const lightsBindGroupLayout = this.createLightsBindGroupLayout()
    const meshBindGroupLayout = this.createMeshBindGroupLayout()

    this.writeGBufferPipeline = this.createWriteGBufferPipeline([sceneBindGroupLayout, meshBindGroupLayout, PbrMaterial.bindGroupLayout!])
    this.deferredRenderPipeline = this.createDeferredRenderPipeline([this.gBuffer.getBindGroupLayout(), sceneBindGroupLayout, lightsBindGroupLayout], false)

    this.lightsBuffer = this.createLightsBuffer()
    this.lightsBindGroup = this.createLightsBindGroup(lightsBindGroupLayout)
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

  private createMeshBindGroupLayout() {
    return this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          buffer: {
            type: 'uniform',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        },
        {
          binding: 1,
          buffer: {
            type: 'uniform',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        },
      ],
    })
  }

  private createWriteGBufferPipeline(bindGroupLayouts: GPUBindGroupLayout[]): GPURenderPipeline {
    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: bindGroupLayouts,
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: writeGBufferVert,
        }),
        // TODO: Generate buffer info out of VertexAttributeTypes
        buffers: [
          {
            arrayStride: 12,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3',
              },
            ],
          },
          {
            arrayStride: 12,
            attributes: [
              {
                shaderLocation: 1,
                offset: 0,
                format: 'float32x3',
              },
            ],
          },
          {
            arrayStride: 12,
            attributes: [
              {
                shaderLocation: 2,
                offset: 0,
                format: 'float32x3',
              },
            ],
          },
          {
            arrayStride: 8,
            attributes: [
              {
                shaderLocation: 3,
                offset: 0,
                format: 'float32x2',
              },
            ],
          },
        ],
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

  private createLightsBuffer(): GPUBuffer {
    return this.device.createBuffer({
      label: 'Lights data',
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      size: 800, // 10 lights for now
    })
  }

  private createLightsBindGroup(lightsBindGroupLayout: GPUBindGroupLayout): GPUBindGroup {
    return this.device.createBindGroup({
      label: 'Lights',
      layout: lightsBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            label: 'Lights data',
            buffer: this.lightsBuffer,
          },
        },
      ],
    })
  }

  private createWriteGBufferPassDescriptor(target: GPUTexture): GPURenderPassDescriptor {
    this.gBuffer.createTextureViews(target.width, target.height)
    return {
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
      if (transform.modelMatrixBuffer == undefined) {
        return
      }
      gBufferPass.setBindGroup(1, transform.bindGroup!)
      meshRenderer.primitives.forEach((primitiveRenderData) => {
        const type = primitiveRenderData.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? 'uint16' : 'uint32'
        gBufferPass.setIndexBuffer(this.gpuDataInterface.getBuffer(primitiveRenderData.indexBufferAccessor.bufferIndex), type)

        // TODO: don't hardcode which is which (i.e. that 0 is POSITION and 1 is NORMAL); somehow ask the asset manager / pipeline / shader where it should be
        const vertexDataMapping = [VertexAttributeType.POSITION, VertexAttributeType.NORMAL, VertexAttributeType.TANGENT, VertexAttributeType.TEXCOORD_0]
        vertexDataMapping.forEach((attributeType, index) => {
          const accessor = primitiveRenderData.vertexAttributes.get(attributeType)!
          const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
          gBufferPass.setVertexBuffer(index, this.gpuDataInterface.getBuffer(accessor.bufferIndex), accessor.offset, accessor.count * byteCount)
        })

        const material = this.gpuDataInterface.getMaterial(primitiveRenderData.materialIndex!)
        gBufferPass.setBindGroup(2, material.bindGroup!)

        gBufferPass.drawIndexed(primitiveRenderData.indexBufferAccessor.count)
      })
    })

    gBufferPass.end()
  }

  private createSceneBindGroupLayout(): GPUBindGroupLayout {
    return this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          buffer: {
            type: 'uniform',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        },
      ],
    })
  }

  private createLightsBindGroupLayout(): GPUBindGroupLayout {
    return this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          buffer: {
            type: 'uniform',
          },
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        },
      ],
    })
  }

  private createDeferredRenderPipeline(bindGroupLayouts: GPUBindGroupLayout[], isSunLight: boolean): GPURenderPipeline {
    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: bindGroupLayouts,
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: deferredRenderingVert,
        }),
      },
      fragment: {
        module: this.device.createShaderModule({
          code: deferredRenderingFrag,
        }),
        targets: [
          {
            format: this.context.getCurrentTexture().format,
          },
        ],
        constants: {
          isSunLight: isSunLight ? 1 : 0,
        },
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
    })
  }

  private createDeferredRenderPassDescriptor(): GPURenderPassDescriptor {
    return {
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

  private doShading(commandEncoder: GPUCommandEncoder, lightsData: LightData[], cameraData: CameraData): void {
    const deferredRenderingPass = commandEncoder.beginRenderPass(this.createDeferredRenderPassDescriptor())
    deferredRenderingPass.setPipeline(this.deferredRenderPipeline)
    deferredRenderingPass.setBindGroup(0, this.gBuffer.getBindGroup())
    // reuse scene bind group for now
    deferredRenderingPass.setBindGroup(1, cameraData.camera.bindGroup!)

    // could do this per light type or even per light in the future
    let lightDataArray = new Float32Array(lightsData.flatMap((lightData) => [...lightData.transform.toMatrix(), ...lightData.light.color, lightData.light.power]))
    this.device.queue.writeBuffer(this.lightsBuffer, 0, lightDataArray.buffer, lightDataArray.byteOffset, lightDataArray.byteLength)

    deferredRenderingPass.setBindGroup(2, this.lightsBindGroup)
    deferredRenderingPass.draw(6)

    deferredRenderingPass.end()
  }

  public render(modelsData: ModelData[], lightsData: LightData[], cameraData: CameraData): void {
    const commandEncoder = this.device.createCommandEncoder()

    this.shadowMapper.renderShadowMap(commandEncoder, modelsData, lightsData[0], cameraData)
    this.writeGBuffer(commandEncoder, modelsData, cameraData)
    this.doShading(commandEncoder, lightsData, cameraData)

    this.debugRenderer.renderDebugOverlay(commandEncoder, this.gBuffer.getDepthAttachment().view, lightsData, [cameraData], cameraData)

    this.device.queue.submit([commandEncoder.finish()])
  }
}
