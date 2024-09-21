import { AssetManager } from '../assets/asset-manager'
import { ModelData, CameraData } from '../systems/renderer'
import { RenderStrategy } from './render-strategy'
import { mat4 } from 'wgpu-matrix'
import { BufferDataComponentType, getBufferDataTypeByteCount, TransformComponent, VertexAttributeType } from '../components/components'

import writeGBufferVert from './writeGBuffer.vert'
import writeGBufferFrag from './writeGBuffer.frag'
import deferredRenderingVert from './deferredRendering.vert'
import deferredRenderingFrag from './deferredRendering.frag'

export class DeferredRenderer implements RenderStrategy {
  private assetManager: AssetManager
  private device!: GPUDevice
  private buffers!: GPUBuffer[]
  private context!: GPUCanvasContext

  private cameraBuffer!: GPUBuffer
  private sceneBindGroup!: GPUBindGroup

  private gBufferTexture2DFloat16!: GPUTexture
  private gBufferTextureAlbedo!: GPUTexture
  private depthTexture!: GPUTexture
  private gBufferTextureViews!: GPUTextureView[]

  private writeGBufferPassDescriptor!: GPURenderPassDescriptor
  private writeGBufferPipeline!: GPURenderPipeline

  private gBufferTexturesBindGroup!: GPUBindGroup
  private deferredRenderPassDescriptor!: GPURenderPassDescriptor
  private deferredRenderPipeline!: GPURenderPipeline

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager
  }

  setRenderingDevice(device: GPUDevice): void {
    this.device = device
  }

  setBuffers(buffers: GPUBuffer[]): void {
    this.buffers = buffers
  }

  setRenderingContext(context: GPUCanvasContext): void {
    this.context = context
    this.createWriteGBufferPipeline()
    this.createSceneBindGroup()

    this.createDeferredRenderPipeline()
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
        bindGroupLayouts: [sceneBindGroupLayout, meshBindGroupLayout],
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
            arrayStride: 8,
            attributes: [
              {
                shaderLocation: 2,
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
        targets: [
          // normal
          { format: 'rgba16float' },
          // albedo
          { format: 'bgra8unorm' },
        ],
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
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

  createGBufferTextureViews(width: number, height: number): void {
    this.gBufferTexture2DFloat16?.destroy()
    this.gBufferTexture2DFloat16 = this.device.createTexture({
      size: [width, height],
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: 'rgba16float',
    })
    this.gBufferTextureAlbedo?.destroy()
    this.gBufferTextureAlbedo = this.device.createTexture({
      size: [width, height],
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
      format: 'bgra8unorm',
    })
    this.depthTexture?.destroy()
    this.depthTexture = this.device.createTexture({
      size: [width, height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
    })

    this.gBufferTextureViews = [this.gBufferTexture2DFloat16.createView(), this.gBufferTextureAlbedo.createView(), this.depthTexture.createView()]
  }

  createWriteGBufferPassDescriptor(target: GPUTexture): void {
    if (!this.depthTexture || this.depthTexture.width != target.width || this.depthTexture.height != target.height) {
      this.createGBufferTextureViews(target.width, target.height)
      this.createGBufferTexturesBindGroup()
    }

    this.writeGBufferPassDescriptor = {
      colorAttachments: [
        {
          view: this.gBufferTextureViews[0],

          clearValue: [0.0, 0.0, 1.0, 1.0],
          loadOp: 'clear',
          storeOp: 'store',
        },
        {
          view: this.gBufferTextureViews[1],

          clearValue: [0, 0, 0, 1],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.gBufferTextureViews[2],

        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
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
        const vertexDataMapping = [VertexAttributeType.POSITION, VertexAttributeType.NORMAL, VertexAttributeType.TEXCOORD_0]
        vertexDataMapping.forEach((attributeType, index) => {
          const accessor = primitiveRenderData.vertexAttributes.get(attributeType)!
          const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
          gBufferPass.setVertexBuffer(index, this.buffers[accessor.bufferIndex], accessor.offset, accessor.count * byteCount)
        })

        /*
        const material = this.assetManager.materials[primitiveRenderData.materialIndex!]
        passEncoder.setBindGroup(2, material.bindGroup!)
        */

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

    const gBufferTexturesBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'unfilterable-float',
          },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'unfilterable-float',
          },
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          texture: {
            sampleType: 'depth',
          },
        },
      ],
    })

    this.deferredRenderPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [gBufferTexturesBindGroupLayout, sceneBindGroupLayout],
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

  createGBufferTexturesBindGroup(): void {
    this.gBufferTexturesBindGroup = this.device.createBindGroup({
      layout: this.deferredRenderPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: this.gBufferTextureViews[0],
        },
        {
          binding: 1,
          resource: this.gBufferTextureViews[1],
        },
        {
          binding: 2,
          resource: this.gBufferTextureViews[2],
        },
      ],
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

  doShading(commandEncoder: GPUCommandEncoder): void {
    this.createDeferredRenderPassDescriptor()
    const deferredRenderingPass = commandEncoder.beginRenderPass(this.deferredRenderPassDescriptor)
    deferredRenderingPass.setPipeline(this.deferredRenderPipeline)
    deferredRenderingPass.setBindGroup(0, this.gBufferTexturesBindGroup)
    // reuse scene bind group for now
    deferredRenderingPass.setBindGroup(1, this.sceneBindGroup)
    deferredRenderingPass.draw(6)
    deferredRenderingPass.end()
  }

  render(modelsData: ModelData[], cameraData: CameraData): void {
    if (!this.device || !this.buffers || !this.assetManager) {
      throw new Error('Rendering device, buffers and asset manager must be set before calling render.')
    }

    const commandEncoder = this.device.createCommandEncoder()
    this.writeGBuffer(commandEncoder, modelsData, cameraData)
    this.doShading(commandEncoder)
    this.device.queue.submit([commandEncoder.finish()])
  }
}
