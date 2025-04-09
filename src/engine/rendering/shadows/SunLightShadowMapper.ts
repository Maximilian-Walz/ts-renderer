import { BufferDataComponentType, getBufferDataTypeByteCount, VertexAttributeType } from '../../assets/Mesh'
import { CameraComponent, LightComponent, TransformComponent } from '../../components'
import { CameraData, ModelData, ShadowMapLightData } from '../../systems/Renderer'
import { ShadowMapper } from './ShadowMapper'
import shadowMapperVert from './shadowMapper.vert.wgsl'

export class SunLightShadowMapper extends ShadowMapper {
  private shadowPipeline: GPURenderPipeline

  constructor(device: GPUDevice) {
    super(device)
    this.shadowPipeline = this.createPipeline()
  }

  private createPipeline(): GPURenderPipeline {
    return this.device.createRenderPipeline({
      label: 'Shadow mapping',
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: [LightComponent.getBindGroupLayout(this.device), CameraComponent.getBindGroupLayout(this.device), TransformComponent.getBindGroupLayout(this.device)],
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

  public renderShadowMap(commandEncoder: GPUCommandEncoder, modelsData: ModelData[], { light, shadowMap }: ShadowMapLightData, cameraData: CameraData) {
    const shadowPass = commandEncoder.beginRenderPass({
      label: 'Shadow mapping',
      colorAttachments: [],
      depthStencilAttachment: {
        view: shadowMap.getOrCreateBindGroupData(this.device).textureView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    })
    shadowPass.setPipeline(this.shadowPipeline)
    shadowPass.setBindGroup(0, light.getOrCreateBindGroupData(this.device).bindGroup)
    shadowPass.setBindGroup(1, cameraData.camera.getOrCreateBindGroupData(this.device).bindGroup)

    modelsData.forEach(({ transform, meshRenderer }) => {
      shadowPass.setBindGroup(2, transform.getOrCreateBindGroupData(this.device).bindGroup)
      meshRenderer.primitives.forEach(({ meshLoader }) => {
        const mesh = meshLoader.getAssetData()
        const type = mesh.indexBufferAccessor.componentType == BufferDataComponentType.UNSIGNED_SHORT ? 'uint16' : 'uint32'
        const indexBuffer = mesh.indexBufferAccessor.buffer.getAssetData()
        shadowPass.setIndexBuffer(indexBuffer, type)

        const accessor = mesh.vertexAttributes.get(VertexAttributeType.POSITION)!
        const byteCount = getBufferDataTypeByteCount(accessor.type, accessor.componentType)
        const buffer = accessor.buffer.getAssetData()
        shadowPass.setVertexBuffer(0, buffer, accessor.offset, accessor.count * byteCount)

        shadowPass.drawIndexed(mesh.indexBufferAccessor.count)
      })
    })

    shadowPass.end()
  }
}
