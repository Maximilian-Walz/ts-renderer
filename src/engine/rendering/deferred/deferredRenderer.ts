import { mat4 } from 'wgpu-matrix'
import { AssetManager } from '../../assets/asset-manager'
import { BufferDataComponentType, TransformComponent, VertexAttributeType, getBufferDataTypeByteCount } from '../../components/components'
import { CameraData, LightData, ModelData } from '../../systems/renderer'
import { RenderStrategy } from '../render-strategy'

import { PbrMaterial } from '../../material'
import deferredRenderingFrag from './deferredRendering.frag'
import deferredRenderingVert from './deferredRendering.vert'
import { GBuffer } from './gBuffer'
import writeGBufferFrag from './writeGBuffer.frag'
import writeGBufferVert from './writeGBuffer.vert'

export class DeferredRenderer implements RenderStrategy {
  private assetManager: AssetManager
  private device!: GPUDevice
  private buffers!: GPUBuffer[]
  private context!: GPUCanvasContext

  private cameraBuffer!: GPUBuffer
  private sceneBindGroup!: GPUBindGroup

  private lightsBuffer!: GPUBuffer
  private lightsBindGroup!: GPUBindGroup

  private gBuffer!: GBuffer
  private writeGBufferPassDescriptor!: GPURenderPassDescriptor
  private writeGBufferPipeline!: GPURenderPipeline

  private deferredRenderPassDescriptor!: GPURenderPassDescriptor
  private deferredRenderPipeline!: GPURenderPipeline

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager
  }

  setRenderingDevice(device: GPUDevice): void {
    this.device = device

    this.gBuffer = new GBuffer(device)
    this.gBuffer.addTexture('normal', 'rgba16float', [0.0, 0.0, 1.0, 1.0], 'unfilterable-float')
    this.gBuffer.addTexture('albedo', 'bgra8unorm', [0.0, 0.0, 0.0, 1.0], 'unfilterable-float')
    this.gBuffer.addTexture('orm', 'rgba16float', [0.0, 0.0, 0.0, 1.0], 'unfilterable-float')
    this.gBuffer.addTexture('emission', 'rgba16float', [0.0, 0.0, 0.0, 1.0], 'unfilterable-float')
    this.gBuffer.addTexture('depth', 'depth24plus', 1.0, 'depth')
  }

  setBuffers(buffers: GPUBuffer[]): void {
    this.buffers = buffers
  }

  setRenderingContext(context: GPUCanvasContext): void {
    this.context = context
    this.createWriteGBufferPipeline()
    this.createSceneBindGroup()

    this.createDeferredRenderPipeline()
    this.createLightsBindGroup()
  }

  createWriteGBufferPipeline(): void {
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

  createSceneBindGroup() {
    this.cameraBuffer = this.device.createBuffer({
      label: 'Camera data',
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      size: 128,
    })

    this.sceneBindGroup = this.device.createBindGroup({
      label: 'Scene',
      layout: this.writeGBufferPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            label: 'Camera data',
            buffer: this.cameraBuffer,
          },
        },
      ],
    })
  }

  createLightsBindGroup() {
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

  createWriteGBufferPassDescriptor(target: GPUTexture): void {
    this.gBuffer.createTextureViews(target.width, target.height)
    this.writeGBufferPassDescriptor = {
      colorAttachments: ['normal', 'albedo', 'orm', 'emission'].map((textureName) => this.gBuffer.getColorAttachment(textureName)),
      depthStencilAttachment: this.gBuffer.getDepthAttachment(),
    }
  }

  writeGBuffer(commandEncoder: GPUCommandEncoder, modelsData: ModelData[], cameraData: CameraData): void {
    const target = this.context.getCurrentTexture()

    const projectionMatrix = cameraData.camera.getProjection(target.width, target.height)
    const viewMatrix = TransformComponent.calculateGlobalCameraTransform(cameraData.transform)
    const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix)

    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewProjectionMatrix.buffer, viewProjectionMatrix.byteOffset, viewProjectionMatrix.byteLength)
    const cameraInvViewProj = mat4.invert(viewProjectionMatrix)
    this.device.queue.writeBuffer(this.cameraBuffer, 64, cameraInvViewProj.buffer, cameraInvViewProj.byteOffset, cameraInvViewProj.byteLength)

    this.createWriteGBufferPassDescriptor(target)
    const gBufferPass = commandEncoder.beginRenderPass(this.writeGBufferPassDescriptor)
    gBufferPass.setPipeline(this.writeGBufferPipeline)
    gBufferPass.setBindGroup(0, this.sceneBindGroup)

    modelsData.forEach(({ transform, meshRenderer }) => {
      if (meshRenderer.modelMatrixBuffer == undefined) {
        return
      }

      const modelMatrix = TransformComponent.calculateGlobalTransform(transform)
      const mvpMatrix = mat4.multiply(viewProjectionMatrix, modelMatrix)
      this.device.queue.writeBuffer(meshRenderer.modelMatrixBuffer!, 0, mvpMatrix.buffer, mvpMatrix.byteOffset, mvpMatrix.byteLength)

      const normalMatrix = mat4.invert(modelMatrix)
      mat4.transpose(normalMatrix, normalMatrix)
      this.device.queue.writeBuffer(meshRenderer.normalmatrixBuffer!, 0, normalMatrix.buffer, normalMatrix.byteOffset, normalMatrix.byteLength)
      gBufferPass.setBindGroup(1, meshRenderer.bindGroup!)

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

        const material = this.assetManager.materials[primitiveRenderData.materialIndex!]
        gBufferPass.setBindGroup(2, material.bindGroup!)

        gBufferPass.drawIndexed(primitiveRenderData.indexBufferAccessor.count)
      })
    })

    gBufferPass.end()
  }

  createDeferredRenderPipeline(): void {
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

  createDeferredRenderPassDescriptor(): void {
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

  doShading(commandEncoder: GPUCommandEncoder, lightsData: LightData[]): void {
    this.createDeferredRenderPassDescriptor()
    const deferredRenderingPass = commandEncoder.beginRenderPass(this.deferredRenderPassDescriptor)
    deferredRenderingPass.setPipeline(this.deferredRenderPipeline)
    deferredRenderingPass.setBindGroup(0, this.gBuffer.getBindGroup())
    // reuse scene bind group for now
    deferredRenderingPass.setBindGroup(1, this.sceneBindGroup)

    // could do this per light type or even per light in the future
    let lightDataArray = new Float32Array(lightsData.flatMap((lightData) => [...lightData.transform.toMatrix(), ...lightData.light.color, lightData.light.power]))
    this.device.queue.writeBuffer(this.lightsBuffer, 0, lightDataArray.buffer, lightDataArray.byteOffset, lightDataArray.byteLength)

    deferredRenderingPass.setBindGroup(2, this.lightsBindGroup)
    deferredRenderingPass.draw(6)

    deferredRenderingPass.end()
  }

  render(modelsData: ModelData[], lightsData: LightData[], cameraData: CameraData): void {
    if (!this.device || !this.buffers || !this.assetManager) {
      throw new Error('Rendering device, buffers and asset manager must be set before calling render.')
    }

    const commandEncoder = this.device.createCommandEncoder()
    this.writeGBuffer(commandEncoder, modelsData, cameraData)
    this.doShading(commandEncoder, lightsData)
    this.device.queue.submit([commandEncoder.finish()])
  }
}
