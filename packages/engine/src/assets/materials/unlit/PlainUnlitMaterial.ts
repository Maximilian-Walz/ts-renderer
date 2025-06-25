import { Vec3 } from 'wgpu-matrix'
import { BufferBindGroupData } from '../../../rendering/bind-group-data/BufferBindGroupData'
import { VertexAttributeType } from '../../Mesh'
import { MaterialProps, VertexAttributeInfo } from '../Material'
import plainUnlitFrag from './plainUnlit.frag.wgsl'
import plainUnlitVert from './plainUnlit.vert.wgsl'
import { UnlitMaterial } from './UnlitMaterial'

export class PlainUnlitMaterialProps extends MaterialProps {
  public color: Vec3

  constructor(color: Vec3) {
    super()
    this.color = color
  }

  public destroyGpuData() {}
}

export class PlainUnlitMaterial extends UnlitMaterial {
  private buffer: GPUBuffer
  private bindGroup: GPUBindGroup

  private static pipeline: GPURenderPipeline
  private static bindGroupLayout: GPUBindGroupLayout

  constructor(materialProps: PlainUnlitMaterialProps, device: GPUDevice) {
    super()

    this.buffer = device.createBuffer({
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
      size: 16,
      mappedAtCreation: true,
    })
    new Float32Array(this.buffer.getMappedRange()).set(materialProps.color)
    this.buffer.unmap()

    if (PlainUnlitMaterial.bindGroupLayout == undefined) {
      PlainUnlitMaterial.bindGroupLayout = device.createBindGroupLayout(PlainUnlitMaterial.getBindGroupLayoutDescritor())
    }

    if (PlainUnlitMaterial.pipeline == undefined) {
      PlainUnlitMaterial.pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({
          bindGroupLayouts: [BufferBindGroupData.getLayout(device), BufferBindGroupData.getLayout(device), PlainUnlitMaterial.bindGroupLayout],
        }),
        vertex: {
          module: device.createShaderModule({
            code: plainUnlitVert,
          }),
          buffers: this.getVertexDataMapping().map(({ format, stride }, index) => {
            return {
              arrayStride: stride,
              attributes: [
                {
                  shaderLocation: index,
                  offset: 0,
                  format: format,
                },
              ],
            }
          }),
        },
        fragment: {
          module: device.createShaderModule({
            code: plainUnlitFrag,
          }),
          targets: [
            {
              format: 'bgra8unorm',
            },
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

    this.bindGroup = device.createBindGroup({
      layout: PlainUnlitMaterial.bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.buffer,
          },
        },
      ],
    })
  }

  public getBindGroup(): GPUBindGroup {
    return this.bindGroup
  }
  public getPipeline(): GPURenderPipeline {
    return PlainUnlitMaterial.pipeline
  }

  private static getBindGroupLayoutDescritor(): GPUBindGroupLayoutDescriptor {
    return {
      label: 'Unlit Material',
      entries: [
        { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } }, // Color
      ],
    }
  }

  public override getVertexDataMapping(): VertexAttributeInfo[] {
    return [
      {
        type: VertexAttributeType.POSITION,
        format: 'float32x3',
        stride: 12,
      },
      {
        type: VertexAttributeType.NORMAL,
        format: 'float32x3',
        stride: 12,
      },
      {
        type: VertexAttributeType.TANGENT,
        format: 'float32x4',
        stride: 16,
      },
    ]
  }
}
