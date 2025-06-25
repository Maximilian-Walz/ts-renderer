import { CameraComponent, ComponentType } from "../../../components"
import { BillboardsData } from "../../../systems/RendererSystem"
import { BufferBindGroupData } from "../../bind-group-data/BufferBindGroupData"
import { TextureBindGroupData } from "../../bind-group-data/TextureBindGroupData"
import { Renderer, RenderingData } from "../Renderer"
import obscuredBillboardFrag from "./obscuredBillboardRendering.frag.wgsl"
import obscuredBillboardVert from "./obscuredBillboardRendering.vert.wgsl"

export class ObscuredBillboardRenderer extends Renderer {
  private quadBuffer: GPUBuffer
  private pipeline: GPURenderPipeline

  constructor(device: GPUDevice, targetTextureFormat: GPUTextureFormat) {
    super(device)

    this.quadBuffer = this.createQuadBuffer()
    this.pipeline = this.createPipeline(targetTextureFormat, [
      BufferBindGroupData.getLayout(this.device),
      BufferBindGroupData.getLayout(this.device),
      TextureBindGroupData.getLayout(this.device),
    ])
  }

  private createQuadBuffer() {
    const quadBuffer = this.device.createBuffer({
      label: "Quad vertices",
      usage: GPUBufferUsage.VERTEX,
      size: Float32Array.BYTES_PER_ELEMENT * 3 * 4,
      mappedAtCreation: true,
    })
    const quadData = new Float32Array(quadBuffer.getMappedRange())
    quadData.set([0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, -0.5, 0.5, 0])
    quadBuffer.unmap()
    return quadBuffer
  }

  private createPipeline(
    targetTextureFormat: GPUTextureFormat,
    bindGroupLayouts: GPUBindGroupLayout[]
  ): GPURenderPipeline {
    return this.device.createRenderPipeline({
      label: "Billboards",
      layout: this.device.createPipelineLayout({
        bindGroupLayouts: bindGroupLayouts,
      }),
      vertex: {
        module: this.device.createShaderModule({
          code: obscuredBillboardVert,
        }),
        buffers: [
          {
            arrayStride: 12,
            attributes: [
              {
                shaderLocation: 0,
                offset: 0,
                format: "float32x3",
              },
            ],
          },
        ],
      },
      fragment: {
        module: this.device.createShaderModule({
          code: obscuredBillboardFrag,
        }),
        targets: [
          {
            format: targetTextureFormat,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          },
        ],
      },
      depthStencil: {
        depthWriteEnabled: false,
        depthCompare: "less",
        format: "depth24plus",
      },
      primitive: {
        topology: "triangle-strip",
        cullMode: "none",
      },
    })
  }

  public render(commandEncoder: GPUCommandEncoder, renderingData: RenderingData): RenderingData {
    const { target, depth, scene, cameraId } = renderingData

    const billboardPass = commandEncoder.beginRenderPass({
      label: "Debug overlays",
      colorAttachments: [
        {
          view: target,
          loadOp: "load",
          storeOp: "store",
        },
      ],
      depthStencilAttachment: depth && {
        view: depth,
        depthLoadOp: "load",
        depthStoreOp: "discard",
      },
    })

    const camera = scene.getEntity(cameraId).getComponent(CameraComponent)
    const billboardsData = scene.getComponents([ComponentType.TRANSFORM, ComponentType.BILLBOARD]) as BillboardsData[]

    billboardPass.setPipeline(this.pipeline)
    billboardPass.setBindGroup(0, camera.getOrCreateBindGroupData(this.device).bindGroup)
    billboardPass.setVertexBuffer(0, this.quadBuffer)
    billboardsData.forEach(({ transform, billboard }) => {
      billboardPass.setBindGroup(1, transform.getOrCreateBindGroupData(this.device).bindGroup)
      billboardPass.setBindGroup(2, billboard.getOrCreateBindGroupData(this.device).bindGroup)
      billboardPass.draw(4)
    })
    billboardPass.end()

    return renderingData
  }
}
