import { GltfAssetManager } from '../../assets/GltfAssetManager'
import { BufferDataComponentType, VertexAttributeType, getBufferDataTypeByteCount } from '../../components/components'
import { CameraData, LightData, ModelData } from '../../systems/Renderer'
import { RenderStrategy } from '../RenderStrategy'

import { StaticAssetManager } from '../../assets/StaticAssetsManager'
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
  private gltfAssetManager: GltfAssetManager
  private staticAssetManager: StaticAssetManager
  private device!: GPUDevice
  private buffers!: GPUBuffer[]
  private context!: GPUCanvasContext

  private lightsBuffer!: GPUBuffer
  private lightsBindGroup!: GPUBindGroup

  private gBuffer!: GBuffer
  private writeGBufferPassDescriptor!: GPURenderPassDescriptor
  private writeGBufferPipeline!: GPURenderPipeline

  private deferredRenderPassDescriptor!: GPURenderPassDescriptor
  private deferredRenderPipeline!: GPURenderPipeline

  private shadowMapper!: ShadowMapper
  private debugRenderer!: DebugRenderer

  constructor(assetManager: GltfAssetManager, staticAssetManager: StaticAssetManager) {
    this.gltfAssetManager = assetManager
    this.staticAssetManager = staticAssetManager
  }

  public setRenderingDevice(device: GPUDevice): void {
    this.device = device

    this.gBuffer = new GBuffer(device)
    this.gBuffer.addTexture('normal', 'rgba16float', [0.0, 0.0, 1.0, 1.0], 'unfilterable-float')
    this.gBuffer.addTexture('albedo', 'bgra8unorm', [0.0, 0.0, 0.0, 1.0], 'unfilterable-float')
    this.gBuffer.addTexture('orm', 'rgba16float', [0.0, 0.0, 0.0, 1.0], 'unfilterable-float')
    this.gBuffer.addTexture('emission', 'rgba16float', [0.0, 0.0, 0.0, 1.0], 'unfilterable-float')
    this.gBuffer.addTexture('depth', 'depth24plus', 1.0, 'depth')
  }

  public setBuffers(buffers: GPUBuffer[]): void {
    this.buffers = buffers

    // TODO: move this somewhere better
    this.shadowMapper = new SunLightShadowMapper(this.device, this.buffers)
  }

  public setRenderingContext(context: GPUCanvasContext): void {
    this.context = context
    this.debugRenderer = new DebugRenderer(this.device, this.context, this.staticAssetManager)
    this.createWriteGBufferPipeline()

    this.createDeferredRenderPipeline()
    this.createLightsBindGroup()
  }

  private createWriteGBufferPipeline(): void {
    const sceneBindGroupLayout = this.device.createBindGroupLayout({
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

    const meshBindGroupLayout = this.device.createBindGroupLayout({
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

    this.writeGBufferPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [sceneBindGroupLayout, meshBindGroupLayout, PbrMaterial.bindGroupLayout!],
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

  private createLightsBindGroup() {
    this.lightsBuffer = this.device.createBuffer({
      label: 'Lights data',
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      size: 800, // 10 lights for now
    })

    this.lightsBindGroup = this.device.createBindGroup({
      label: 'Lights',
      layout: this.deferredRenderPipeline.getBindGroupLayout(2),
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

  private createWriteGBufferPassDescriptor(target: GPUTexture): void {
    this.gBuffer.createTextureViews(target.width, target.height)
    this.writeGBufferPassDescriptor = {
      colorAttachments: ['normal', 'albedo', 'orm', 'emission'].map((textureName) => this.gBuffer.getColorAttachment(textureName)),
      depthStencilAttachment: this.gBuffer.getDepthAttachment(),
    }
  }

  private writeGBuffer(commandEncoder: GPUCommandEncoder, modelsData: ModelData[], cameraData: CameraData): void {
    const target = this.context.getCurrentTexture()
    this.createWriteGBufferPassDescriptor(target)
    const gBufferPass = commandEncoder.beginRenderPass(this.writeGBufferPassDescriptor)
    gBufferPass.setPipeline(this.writeGBufferPipeline)
    gBufferPass.setBindGroup(0, cameraData.camera.bindGroup!)

    modelsData.forEach(({ transform, meshRenderer }) => {
      if (transform.modelMatrixBuffer == undefined) {
        return
      }
      gBufferPass.setBindGroup(1, transform.bindGroup!)
      meshRenderer.primitives.forEach((primitiveRenderData) => {
        const type = primitiveRenderData.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? 'uint16' : 'uint32'
        gBufferPass.setIndexBuffer(this.buffers[primitiveRenderData.indexBufferAccessor.bufferIndex], type)

        // TODO: don't hardcode which is which (i.e. that 0 is POSITION and 1 is NORMAL); somehow ask the asset manager / pipeline / shader where it should be
        const vertexDataMapping = [VertexAttributeType.POSITION, VertexAttributeType.NORMAL, VertexAttributeType.TANGENT, VertexAttributeType.TEXCOORD_0]
        vertexDataMapping.forEach((attributeType, index) => {
          const accessor = primitiveRenderData.vertexAttributes.get(attributeType)!
          const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
          gBufferPass.setVertexBuffer(index, this.buffers[accessor.bufferIndex], accessor.offset, accessor.count * byteCount)
        })

        const material = this.gltfAssetManager.materials[primitiveRenderData.materialIndex!]
        gBufferPass.setBindGroup(2, material.bindGroup!)

        gBufferPass.drawIndexed(primitiveRenderData.indexBufferAccessor.count)
      })
    })

    gBufferPass.end()
  }

  private createDeferredRenderPipeline(): void {
    // TODO: reuse sceneBindGroupLayout from other pipeline creation (if I actually want to reuse that here in the future)
    const sceneBindGroupLayout = this.device.createBindGroupLayout({
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

    const lightsBindGroupLayout = this.device.createBindGroupLayout({
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

    this.deferredRenderPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [this.gBuffer.getBindGroupLayout(), sceneBindGroupLayout, lightsBindGroupLayout],
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
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
    })
  }

  private createDeferredRenderPassDescriptor(): void {
    this.deferredRenderPassDescriptor = {
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
    this.createDeferredRenderPassDescriptor()
    const deferredRenderingPass = commandEncoder.beginRenderPass(this.deferredRenderPassDescriptor)
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
    if (!this.device || !this.buffers || !this.gltfAssetManager) {
      throw new Error('Rendering device, buffers and asset manager must be set before calling render.')
    }
    const commandEncoder = this.device.createCommandEncoder()

    this.shadowMapper.renderShadowMap(commandEncoder, modelsData, lightsData[0], cameraData)
    this.writeGBuffer(commandEncoder, modelsData, cameraData)
    this.doShading(commandEncoder, lightsData, cameraData)

    this.debugRenderer.renderDebugOverlay(commandEncoder, this.gBuffer.getDepthAttachment().view, lightsData, [cameraData], cameraData)

    this.device.queue.submit([commandEncoder.finish()])
  }
}
