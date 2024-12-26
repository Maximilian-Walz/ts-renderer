import { mat4 } from 'wgpu-matrix'
import { BufferDataComponentType, TransformComponent, VertexAttributeType, getBufferDataTypeByteCount } from '../../components/components'
import { CameraData, LightData, ModelData } from '../../systems/Renderer'
import { ShadowMapper } from './ShadowMapper'
import shadowMapperVert from './shadowMapper.vert'

export class SunLightShadowMapper extends ShadowMapper {
  private sceneBindGroup!: GPUBindGroup
  private lightBuffer!: GPUBuffer

  private shadowPipeline!: GPURenderPipeline

  constructor(device: GPUDevice, buffers: GPUBuffer[]) {
    super(device, buffers)

    this.createPipeline()
    this.createSceneBindGroup()
  }

  private createPipeline() {
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

    this.shadowPipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [sceneBindGroupLayout, meshBindGroupLayout],
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: shadowMapperVert,
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
        ],
      },
      depthStencil: {
        depthWriteEnabled: true,
        depthCompare: 'less',
        format: 'depth32float',
      },
      primitive: {
        topology: 'triangle-list',
        cullMode: 'back',
      },
    })
  }

  createSceneBindGroup() {
    this.lightBuffer = this.device.createBuffer({
      label: 'Light ViewProjection data',
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      size: 64,
    })

    this.sceneBindGroup = this.device.createBindGroup({
      label: 'Scene',
      layout: this.shadowPipeline.getBindGroupLayout(0),
      entries: [
        {
          binding: 0,
          resource: {
            label: 'Camera data',
            buffer: this.lightBuffer,
          },
        },
      ],
    })
  }

  public renderShadowMap(commandEncoder: GPUCommandEncoder, modelsData: ModelData[], lightData: LightData, cameraData: CameraData) {
    if (lightData == undefined || !lightData.light.castsShadow) {
      return
    }

    const viewMatrix = TransformComponent.calculateGlobalCameraTransform(lightData.transform)
    const viewProjectionMatrix = mat4.multiply(lightData.light.getProjection(), viewMatrix)
    this.device.queue.writeBuffer(this.lightBuffer, 0, viewProjectionMatrix.buffer, viewProjectionMatrix.byteOffset, viewProjectionMatrix.byteLength)

    const shadowPass = commandEncoder.beginRenderPass({
      colorAttachments: [],
      depthStencilAttachment: {
        view: lightData.light.shadowMap!.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    })
    shadowPass.setPipeline(this.shadowPipeline)
    shadowPass.setBindGroup(0, this.sceneBindGroup)

    modelsData.forEach(({ transform, meshRenderer }) => {
      if (transform.modelMatrixBuffer == undefined) {
        return
      }
      shadowPass.setBindGroup(1, transform.bindGroup!)
      meshRenderer.primitives.forEach((primitiveRenderData) => {
        const type = primitiveRenderData.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? 'uint16' : 'uint32'
        shadowPass.setIndexBuffer(this.buffers[primitiveRenderData.indexBufferAccessor.bufferIndex], type)

        const accessor = primitiveRenderData.vertexAttributes.get(VertexAttributeType.POSITION)!
        const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
        shadowPass.setVertexBuffer(0, this.buffers[accessor.bufferIndex], accessor.offset, accessor.count * byteCount)

        shadowPass.drawIndexed(primitiveRenderData.indexBufferAccessor.count)
      })
    })

    shadowPass.end()
  }
}
