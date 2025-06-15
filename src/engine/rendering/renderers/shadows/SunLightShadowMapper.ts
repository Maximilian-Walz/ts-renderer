import { BufferDataComponentType, getBufferDataTypeByteCount, VertexAttributeType } from '../../../assets/Mesh'
import { CameraComponent, ComponentType, LightComponent, LightType, TransformComponent } from '../../../components'
import { ModelData, ShadowMapLightData } from '../../../systems/RendererSystem'
import { Renderer, RenderingData } from '../Renderer'
import shadowMapperVert from './shadowMapper.vert.wgsl'

export class SunLightShadowMapper extends Renderer {
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

  public renderShadowMap(commandEncoder: GPUCommandEncoder, shadowCasters: ModelData[], { light, shadowMap }: ShadowMapLightData, camera: CameraComponent) {
    const shadowPass = commandEncoder.beginRenderPass({
      label: 'Shadow mapping',
      colorAttachments: [],
      depthStencilAttachment: {
        view: shadowMap!.getOrCreateBindGroupData(this.device).textureView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    })
    shadowPass.setPipeline(this.shadowPipeline)
    shadowPass.setBindGroup(0, light.getOrCreateBindGroupData(this.device).bindGroup)
    shadowPass.setBindGroup(1, camera.getOrCreateBindGroupData(this.device).bindGroup)

    shadowCasters.forEach(({ transform, meshRenderer }) => {
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

  public render(commandEncoder: GPUCommandEncoder, renderingData: RenderingData): RenderingData {
    const { scene, cameraId } = renderingData
    const shadowCasters = scene.getComponents([ComponentType.TRANSFORM, ComponentType.MESH_RENDERER]) as ModelData[]
    const consideredLights = (scene.getComponents([ComponentType.TRANSFORM, ComponentType.LIGHT, ComponentType.SHADOW_MAP]) as ShadowMapLightData[]).filter(
      ({ light }) => light.castShadow && light.lightType == LightType.SUN
    )

    const activeCamera = scene.getEntity(cameraId).getComponent(CameraComponent)
    consideredLights.forEach((shadowMappingData) => this.renderShadowMap(commandEncoder, shadowCasters, shadowMappingData, activeCamera))

    return renderingData
  }
}
