import { ComponentType } from '.'
import { BindGroupData } from '../rendering/bind-group-data/BindGroupData'
import { Entity } from '../scenes/Entity'

export type ComponentClass<T extends Component<any>> = (new (...args: ConstructorParameters<typeof Component<any>>) => T) & typeof Component<any>

export abstract class Component<Props> {
  public readonly entity: Entity
  protected props: Props

  constructor(entity: Entity, props: Props) {
    this.entity = entity
    this.props = props
  }

  public static getType(): ComponentType {
    throw Error('Method not implemented! Use derived class')
  }

  abstract get type(): ComponentType

  public onCreate(_props: Props): void {}

  public getProps(): Props {
    return this.props
  }
}

export abstract class BindGroupDataComponent<T extends BindGroupData, Props> extends Component<Props> {
  protected bindGroupData: T | undefined

  public abstract createBindGroupData(device: GPUDevice): T

  public static getBindGroupLayout(_device: GPUDevice): GPUBindGroupLayout {
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
