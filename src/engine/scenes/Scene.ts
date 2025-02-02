import { Component, ComponentType } from '../components'

export type Entity = Map<ComponentType, Component>

export class Scene {
  public readonly name: string
  public entities: Map<string, Entity> = new Map()

  constructor(name: string) {
    this.name = name
  }
}
