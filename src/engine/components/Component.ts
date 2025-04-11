import { ComponentType } from '.'
import { BindGroupData } from '../rendering/bind-group-data/BindGroupData'
import { Entity } from '../scenes/Entity'

export abstract class Component<Props> {
  public readonly type: ComponentType
  public readonly entity: Entity
  protected props: Props

  constructor(type: ComponentType, entity: Entity, props: Props) {
    this.type = type
    this.entity = entity
    this.props = props
    this.onInit(props)
  }

  protected onInit(props: Props): void {}

  public getProps(): Props {
    return this.props
  }
}

export abstract class BindGroupDataComponent<T extends BindGroupData, Props> extends Component<Props> {
  protected bindGroupData: T | undefined

  public abstract createBindGroupData(device: GPUDevice): T

  public static getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    throw Error('Method not implemented! Use derived class')
  }

  public getOrCreateBindGroupData(device: GPUDevice): T {
    if (this.bindGroupData == undefined) {
      this.bindGroupData = this.createBindGroupData(device)
    }
    return this.bindGroupData
  }

  public getBindGroupData() {
    return this.bindGroupData
  }
}
