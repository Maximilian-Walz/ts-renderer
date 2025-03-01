export class BindGroupData {
  protected readonly device: GPUDevice
  readonly bindGroupLayout: GPUBindGroupLayout
  readonly bindGroup: GPUBindGroup

  constructor(device: GPUDevice, bindGroupLayout: GPUBindGroupLayout, entries: Iterable<GPUBindGroupEntry>) {
    this.device = device
    this.bindGroupLayout = bindGroupLayout
    this.bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: entries,
    })
  }

  public static getLayout(device: GPUDevice): GPUBindGroupLayout {
    throw Error('Method not implemented! Use derived class')
  }
}
