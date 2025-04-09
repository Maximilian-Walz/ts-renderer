import { ComponentType } from '.'
import { ShadowMapBindGroupData } from '../rendering/bind-group-data/ShadowMapBindGroupData'
import { BindGroupDataComponent } from './Component'

export class ShadowMapComponent extends BindGroupDataComponent<ShadowMapBindGroupData> {
  private _size: number

  constructor(size?: number) {
    super(ComponentType.SHADOW_MAP)
    this._size = size ?? 2048
  }

  public createBindGroupData(device: GPUDevice): ShadowMapBindGroupData {
    return new ShadowMapBindGroupData(device, this.size)
  }

  public static override getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return ShadowMapBindGroupData.getLayout(device)
  }

  get size() {
    return this._size
  }

  public upateSize(size: number) {
    if (this._size == size) {
      return
    }
    console.log(size)
    this._size = size
    this.bindGroupData?.updateShadowMapSize(size)
  }

  public toJson(): Object {
    throw new Error('Method not implemented.')
  }
}
