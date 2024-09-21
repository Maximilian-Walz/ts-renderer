import { mat4 } from 'wgpu-matrix'
import simpleShader from '../../simple-shader'
import { AssetManager } from '../assets/asset-manager'
import { BufferDataComponentType, TransformComponent, VertexAttributeType, getBufferDataTypeByteCount } from '../components/components'
import { CameraData, ModelData } from '../systems/renderer'
import { RenderStrategy } from './render-strategy'

export class ForwardRenderer implements RenderStrategy {
  private assetManager: AssetManager
  private device!: GPUDevice
  private buffers!: GPUBuffer[]
  private pipeline!: GPURenderPipeline
  private context!: GPUCanvasContext

  private depthTexture: GPUTexture | undefined

  private sceneBindGroup!: GPUBindGroup
  private cameraBuffer!: GPUBuffer

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager
  }
  setRenderTarget(target: GPUTexture): void {
    throw new Error('Method not implemented.')
  }

  setRenderingDevice(device: GPUDevice): void {
    this.device = device
  }
  setBuffers(buffers: GPUBuffer[]): void {
    this.buffers = buffers
  }

  setRenderingContext(context: GPUCanvasContext): void {
    this.context = context
    this.createPipeline()
    this.createSceneBindGroup()
  }

  private createRenderPassDescriptor(target: GPUTexture): GPURenderPassDescriptor {
    if (!this.depthTexture || this.depthTexture.width != target.width || this.depthTexture.height != target.height) {
      this.depthTexture = this.device.createTexture({
        label: 'Depth texture',
        size: [target.width, target.height],
        format: 'depth24plus',
        usage: GPUTextureUsage.RENDER_ATTACHMENT,
      })
    }
    return {
      colorAttachments: [
        {
          view: target.createView(),
          clearValue: [0.5, 0.5, 0.5, 1.0],
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
      depthStencilAttachment: {
        view: this.depthTexture!.createView(),

        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    }
  }

  private createPipeline() {
    if (!this.device) {
      return
    }

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
      ],
    })

    const primitiveBindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          texture: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
        {
          binding: 1,
          sampler: {},
          visibility: GPUShaderStage.FRAGMENT,
        },
      ],
    })

    const module = this.device.createShaderModule({
      code: simpleShader,
    })

    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [sceneBindGroupLayout, meshBindGroupLayout, primitiveBindGroupLayout],
      }),
      vertex: {
        module,
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
        module,
        targets: [{ format: this.context.getCurrentTexture().format }],
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth24plus',
      },
      primitive: {
        // TODO: don't hardcode!
        topology: 'triangle-list',
        cullMode: 'back',
      },
    })
  }

  createSceneBindGroup() {
    this.cameraBuffer = this.device.createBuffer({
      label: 'Camera data',
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      size: 64,
    })

    this.sceneBindGroup = this.device.createBindGroup({
      label: 'Scene',
      layout: this.pipeline.getBindGroupLayout(0),
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

  render(modelsData: ModelData[], cameraData: CameraData): void {
    if (!this.device || !this.buffers || !this.assetManager) {
      throw new Error('Rendering device, buffers and asset manager must be set before calling render.')
    }
    const target = this.context.getCurrentTexture()

    const projectionMatrix = cameraData.camera.getProjection(target.width, target.height)
    const viewMatrix = TransformComponent.calculateGlobalCameraTransform(cameraData.transform)
    const viewProjectionMatrix = mat4.multiply(projectionMatrix, viewMatrix)

    const commandEncoder = this.device.createCommandEncoder()
    const passEncoder = commandEncoder.beginRenderPass(this.createRenderPassDescriptor(target))
    passEncoder.setPipeline(this.pipeline!)

    this.device.queue.writeBuffer(this.cameraBuffer, 0, viewMatrix.buffer, viewMatrix.byteOffset, viewMatrix.byteLength)
    passEncoder.setBindGroup(0, this.sceneBindGroup)

    modelsData.forEach(({ transform, meshRenderer }) => {
      if (meshRenderer.modelMatrixBuffer == undefined) {
        return
      }
      const mvpMatrix = mat4.multiply(viewProjectionMatrix, TransformComponent.calculateGlobalTransform(transform))
      this.device.queue.writeBuffer(meshRenderer.modelMatrixBuffer!, 0, mvpMatrix.buffer, mvpMatrix.byteOffset, mvpMatrix.byteLength)
      passEncoder.setBindGroup(1, meshRenderer.bindGroup!)

      meshRenderer.primitives.forEach((primitiveRenderData) => {
        const type = primitiveRenderData.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? 'uint16' : 'uint32'
        passEncoder.setIndexBuffer(this.buffers[primitiveRenderData.indexBufferAccessor.bufferIndex], type)

        // TODO: don't hardcode which is which (i.e. that 0 is POSITION and 1 is NORMAL); somehow ask the asset manager / pipeline / shader where it should be
        const vertexDataMapping = [VertexAttributeType.POSITION, VertexAttributeType.NORMAL, VertexAttributeType.TEXCOORD_0]
        vertexDataMapping.forEach((attributeType, index) => {
          const accessor = primitiveRenderData.vertexAttributes.get(attributeType)!
          const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
          passEncoder.setVertexBuffer(index, this.buffers[accessor.bufferIndex], accessor.offset, accessor.count * byteCount)
        })

        const material = this.assetManager.materials[primitiveRenderData.materialIndex!]
        passEncoder.setBindGroup(2, material.bindGroup!)
        passEncoder.drawIndexed(primitiveRenderData.indexBufferAccessor.count)
      })
    })

    passEncoder.end()
    this.device.queue.submit([commandEncoder.finish()])
  }
}
