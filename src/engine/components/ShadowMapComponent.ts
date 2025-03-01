import { ComponentType } from '.'
import { ShadowMapBindGroupData } from '../rendering/bind-group-data/ShadowMapBindGroupData'
import { BindGroupDataComponent } from './Component'

export class ShadowMapComponent extends BindGroupDataComponent<ShadowMapBindGroupData> {
  private size: number

  constructor(size?: number) {
    super(ComponentType.SHADOW_MAP)
    this.size = size ?? 2048
  }

  public createBindGroupData(device: GPUDevice): ShadowMapBindGroupData {
    return new ShadowMapBindGroupData(device, this.size)
  }

  public static override getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return ShadowMapBindGroupData.getLayout(device)
  }

  public toJson(): Object {
    throw new Error('Method not implemented.')
  }
}
