import { BindGroupData } from './BindGroupData'

export class BufferBindGroupData extends BindGroupData {
  private static bindGroupLayout: GPUBindGroupLayout
  readonly buffer: GPUBuffer

  constructor(device: GPUDevice, size: number) {
    const buffer = device.createBuffer({
      size: size,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    })

    const entries: GPUBindGroupEntry[] = [
      {
        binding: 0,
        resource: {
          buffer: buffer,
        },
      },
    ]

    super(device, BufferBindGroupData.getLayout(device), entries)
    this.buffer = buffer
  }

  public static override getLayout(device: GPUDevice) {
    if (this.bindGroupLayout == undefined) {
      this.bindGroupLayout = device.createBindGroupLayout({
        label: 'BufferBindGroupData',
        entries: [{ binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: {} }],
      })
    }
    return this.bindGroupLayout
  }
}
