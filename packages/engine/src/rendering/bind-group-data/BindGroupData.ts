export class BindGroupData {
  protected readonly device: GPUDevice
  readonly bindGroupLayout: GPUBindGroupLayout
  private _bindGroup: GPUBindGroup

  constructor(device: GPUDevice, bindGroupLayout: GPUBindGroupLayout, entries: Iterable<GPUBindGroupEntry>) {
    this.device = device
    this.bindGroupLayout = bindGroupLayout
    this._bindGroup = device.createBindGroup({
      layout: bindGroupLayout,
      entries: entries,
    })
  }

  get bindGroup() {
    return this._bindGroup
  }

  public recreateBindGroup(entries: Iterable<GPUBindGroupEntry>) {
    this._bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayout,
      entries: entries,
    })
  }

  public static getLayout(device: GPUDevice): GPUBindGroupLayout {
    throw Error('Method not implemented! Use derived class')
  }
}
