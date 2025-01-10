import { mat4 } from 'wgpu-matrix'
import { BufferDataComponentType, TransformComponent, VertexAttributeType, getBufferDataTypeByteCount } from '../../components/components'
import { GPUDataInterface } from '../../GPUDataInterface'
import { CameraData, LightData, ModelData } from '../../systems/Renderer'
import { ShadowMapper } from './ShadowMapper'
import shadowMapperVert from './shadowMapper.vert.wgsl'

export class SunLightShadowMapper extends ShadowMapper {
  private shadowPipeline: GPURenderPipeline
  private sceneBindGroup: GPUBindGroup
  private lightBuffer: GPUBuffer

  constructor(device: GPUDevice, gpuDataInterface: GPUDataInterface) {
    super(device, gpuDataInterface)

    this.lightBuffer = this.createLightsBuffer()

    const sceneBindGroupLayout = this.createSceneBindGroupLayout()
    const meshBindGroupLayout = this.createMeshBindGroupLayout()
    this.shadowPipeline = this.createPipeline([sceneBindGroupLayout, meshBindGroupLayout])
    this.sceneBindGroup = this.createSceneBindGroup(sceneBindGroupLayout)
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

  private createMeshBindGroupLayout(): GPUBindGroupLayout {
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

  private createPipeline(bindGroupLayouts: GPUBindGroupLayout[]): GPURenderPipeline {
    return this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: bindGroupLayouts,
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

  private createLightsBuffer(): GPUBuffer {
    return this.device.createBuffer({
      label: 'Light ViewProjection data',
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      size: 64,
    })
  }

  private createSceneBindGroup(sceneBindGroupLayout: GPUBindGroupLayout): GPUBindGroup {
    return this.device.createBindGroup({
      label: 'Scene',
      layout: sceneBindGroupLayout,
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
        shadowPass.setIndexBuffer(this.gpuDataInterface.getBuffer(primitiveRenderData.indexBufferAccessor.bufferIndex), type)

        const accessor = primitiveRenderData.vertexAttributes.get(VertexAttributeType.POSITION)!
        const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
        shadowPass.setVertexBuffer(0, this.gpuDataInterface.getBuffer(accessor.bufferIndex), accessor.offset, accessor.count * byteCount)

        shadowPass.drawIndexed(primitiveRenderData.indexBufferAccessor.count)
      })
    })

    shadowPass.end()
  }
}
