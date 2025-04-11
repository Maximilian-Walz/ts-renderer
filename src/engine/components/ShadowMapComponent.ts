import { ComponentType } from '.'
import { ShadowMapBindGroupData } from '../rendering/bind-group-data/ShadowMapBindGroupData'
import { Entity } from '../scenes/Entity'
import { BindGroupDataComponent } from './Component'

export type ShadowMapProps = {
  size: number
}

export class ShadowMapComponent extends BindGroupDataComponent<ShadowMapBindGroupData, ShadowMapProps> {
  constructor(entity: Entity, props: ShadowMapProps) {
    super(ComponentType.SHADOW_MAP, entity, props)
  }

  public createBindGroupData(device: GPUDevice): ShadowMapBindGroupData {
    return new ShadowMapBindGroupData(device, this.props.size)
  }

  public static override getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return ShadowMapBindGroupData.getLayout(device)
  }

  public upateSize(size: number) {
    if (this.props.size == size) {
      return
    }
    console.log(size)
    this.props.size = size
    this.bindGroupData?.updateShadowMapSize(size)
  }

  get size() {
    return this.props.size
  }
}
