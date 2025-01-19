import { Component, ComponentType, NUM_OF_COMPONENT_TYPES, TransformComponent } from './components/components'

export type EntityId = number
type ArchetypeIndex = number

export class Archetype {
  entities: EntityId[] = []
  columns: Component[][] = []
  componentTypeToIndices: Map<ComponentType, number> = new Map()
}

export type EntityNode = {
  name?: string
  childIds: EntityId[]
}

export type EntityTree = {
  rootNodeIds: EntityId[]
  nodes: Map<EntityId, EntityNode>
}

export interface EntityComponentSystem {
  createEntity(tranform: TransformComponent): EntityId
  addComponentToEntity(entityId: EntityId, component: Component): void
  getComponentsAsTuple(componentTypes: ComponentType[]): Component[][]
  getEntityTree(): EntityTree
  getComponentsByEntityId(entityId: EntityId): Component[]
  getComponentByEntityId(entityId: EntityId, type: ComponentType): Component
  getComponentTypesByEntityId(entityId: EntityId): ComponentType[]
  clear(): void
}

export class ArchetypeECS implements EntityComponentSystem {
  private archetypes: Archetype[] = []
  private lastEntityId: EntityId = 0
  private entityToArchetypeIndex: ArchetypeIndex[] = []
  private cachedQueries: Map<string, Archetype[]> = new Map()
  private entityTree: EntityTree = { rootNodeIds: [], nodes: new Map() }

  createEntity(tranform: TransformComponent): EntityId {
    this.lastEntityId++
    tranform.entityId = this.lastEntityId

    if (this.entityTree.nodes.has(this.lastEntityId)) {
      this.entityTree.nodes.get(this.lastEntityId)!.name = tranform.name
    } else {
      this.entityTree.nodes.set(this.lastEntityId, {
        name: tranform.name,
        childIds: [],
      })
    }

    if (!tranform.parent) {
      this.entityTree.rootNodeIds.push(this.lastEntityId)
    } else {
      if (this.entityTree.nodes.has(tranform.parent.entityId!)) {
        this.entityTree.nodes.get(tranform.parent.entityId!)!.childIds.push(this.lastEntityId)
      } else {
        this.entityTree.nodes.set(this.lastEntityId, {
          childIds: [this.lastEntityId],
        })
      }
    }

    this.addComponentToEntity(this.lastEntityId, tranform)
    return this.lastEntityId
  }

  addComponentToEntity(entityId: EntityId, component: Component): void {
    // Remove from current archetype
    const currentArchetype = this.archetypes[this.entityToArchetypeIndex[entityId]]
    let newArchetype: Archetype
    if (currentArchetype) {
      // Update entities in current archetype
      const entityIndexInArchetype = currentArchetype.entities.findIndex((element) => element == entityId)
      currentArchetype.entities.splice(entityIndexInArchetype, 1)

      // TODO: Moving old components seems to not work sometimes

      // Insert entity into correct archetype
      const componentTypes = [component.type, ...currentArchetype.componentTypeToIndices.keys()]
      newArchetype = this.getOrCreateArchetype(componentTypes)
      // Move old components of entity
      for (const [componentType, index] of currentArchetype.componentTypeToIndices.entries()) {
        const oldComponent = currentArchetype.columns[index].splice(entityIndexInArchetype, 1)[0]
        newArchetype.columns[newArchetype.componentTypeToIndices.get(componentType)!].push(oldComponent)
      }
    } else {
      newArchetype = this.getOrCreateArchetype([component.type])
    }

    // Insert new component of entity
    newArchetype.columns[newArchetype.componentTypeToIndices.get(component.type)!].push(component)

    newArchetype.entities.push(entityId)
    this.entityToArchetypeIndex[entityId] = this.archetypes.indexOf(newArchetype)
  }

  private getOrCreateArchetype(componentTypes: ComponentType[]): Archetype {
    // Check if archetype already exists
    const archetype = this.archetypes.find((archetype) => componentTypes.every((componentType) => archetype.componentTypeToIndices.has(componentType)))
    if (archetype) return archetype

    // If not, create it
    const newArchetype = new Archetype()
    newArchetype.columns = componentTypes.map((componentType, index) => {
      newArchetype.componentTypeToIndices.set(componentType, index)
      return []
    })
    this.archetypes.push(newArchetype)

    // Every cached query that queries any subset of componentTypes is invalid now.
    // For now just invalidate the whole cache.
    this.cachedQueries.clear()

    return newArchetype
  }

  queryArchetypes(componentTypes: ComponentType[]): Archetype[] {
    const componentTypesHash = this.hashComponentTypes(componentTypes)
    let result = this.cachedQueries.get(componentTypesHash)
    if (!result) {
      result = this.archetypes.filter((archetype) => componentTypes.every((componentType) => archetype.componentTypeToIndices.has(componentType)))
      this.cachedQueries.set(componentTypesHash, result)
    }
    return result
  }

  private hashComponentTypes(componentTypes: ComponentType[]): string {
    return componentTypes.join(',')
  }

  getComponentsAsTuple(componentTypes: ComponentType[]): Component[][] {
    const resultArchetypes = this.queryArchetypes(componentTypes)
    const entities: Component[][] = []
    resultArchetypes.forEach((archetype) => {
      archetype.entities.forEach((entity, index) => {
        const components: Component[] = []
        componentTypes.forEach((componentType) => components.push(archetype.columns[archetype.componentTypeToIndices.get(componentType)!][index]))
        entities.push(components)
      })
    })
    return entities
  }

  getEntityTree(): EntityTree {
    return this.entityTree
  }

  getComponentsByEntityId(entityId: EntityId): Component[] {
    const archetype = this.archetypes[this.entityToArchetypeIndex[entityId]]
    const rowIndex = archetype.entities.find((value) => value == entityId)!
    return archetype.columns.map((column) => column[rowIndex])
  }

  getEntityComponentMap(): Map<number, Component[]> {
    const componentMap = new Map<number, Component[]>()
    this.archetypes.forEach((archetype) => {
      archetype.entities.forEach((entityId, index) => {
        componentMap.set(
          entityId,
          archetype.columns.map((column) => column[index])
        )
      })
    })
    return componentMap
  }

  clear() {
    this.archetypes = []
    this.lastEntityId = 0
    this.entityToArchetypeIndex = []
    this.cachedQueries.clear()
    this.entityTree.nodes.clear()
    this.entityTree.rootNodeIds = []
  }

  getComponentByEntityId(entityId: number, type: ComponentType): Component {
    throw Error('Not implemented yet')
  }

  getComponentTypesByEntityId(entityId: EntityId): ComponentType[] {
    throw Error('Not implemented yet')
  }
}

type ComponentRecord = {
  entityId: number
  component: Component
}

export class SimpleEcs implements EntityComponentSystem {
  // Maps a ComponentType to a list of entities that have it
  private componentMap: ComponentRecord[][] = Array.from({ length: NUM_OF_COMPONENT_TYPES }, () => [])
  private nextEntityIndex: number = 0

  private entityTree: EntityTree = {
    rootNodeIds: [],
    nodes: new Map(),
  }

  createEntity(tranform: TransformComponent): number {
    const entityIndex = this.nextEntityIndex
    tranform.entityId = entityIndex

    if (this.entityTree.nodes.has(entityIndex)) {
      this.entityTree.nodes.get(entityIndex)!.name = tranform.name
    } else {
      this.entityTree.nodes.set(entityIndex, {
        name: tranform.name,
        childIds: [],
      })
    }

    if (!tranform.parent) {
      this.entityTree.rootNodeIds.push(entityIndex)
    } else {
      if (this.entityTree.nodes.has(tranform.parent.entityId!)) {
        this.entityTree.nodes.get(tranform.parent.entityId!)!.childIds.push(entityIndex)
      } else {
        this.entityTree.nodes.set(entityIndex, {
          childIds: [entityIndex],
        })
      }
    }

    this.addComponentToEntity(entityIndex, tranform)
    this.nextEntityIndex++
    return entityIndex
  }

  addComponentToEntity(entityId: number, component: Component): void {
    this.componentMap[component.type].push({
      entityId: entityId,
      component: component,
    })
  }

  getComponentsAsTuple(componentTypes: ComponentType[]): Component[][] {
    const componentsPerEntity = []
    for (let entityId = 0; entityId < this.nextEntityIndex; entityId++) {
      const validComponents = componentTypes
        .map((componentType) => this.componentMap[componentType].filter((componentRecord) => componentRecord.entityId == entityId))
        .filter((validComponentRecords) => validComponentRecords.length > 0)
        .map((validComponentRecords) => validComponentRecords[0].component)
      if (validComponents.length == componentTypes.length) {
        componentsPerEntity.push(validComponents)
      }
    }
    return componentsPerEntity
  }

  getEntityTree(): EntityTree {
    return this.entityTree
  }

  getComponentsByEntityId(entityId: number): Component[] {
    return this.componentMap
      .map((componentRecords) => componentRecords.filter((componentRecord) => componentRecord.entityId === entityId))
      .filter((validComponentRecords) => validComponentRecords.length > 0)
      .map((validComponentRecords) => validComponentRecords[0].component)
  }

  getComponentByEntityId(entityId: number, type: ComponentType): Component {
    return this.componentMap
      .map((componentRecords) => componentRecords.filter((componentRecord) => componentRecord.entityId === entityId && componentRecord.component.type == type))
      .filter((validComponentRecords) => validComponentRecords.length > 0)
      .map((validComponents) => validComponents[0].component)[0]
  }

  getComponentTypesByEntityId(entityId: number): ComponentType[] {
    return this.componentMap
      .map((componentRecords) => componentRecords.filter((componentRecord) => componentRecord.entityId === entityId))
      .filter((validComponentRecords) => validComponentRecords.length > 0)
      .map((validComponents) => validComponents[0].component.type)
  }

  clear() {
    this.componentMap = Array.from({ length: NUM_OF_COMPONENT_TYPES }, () => [])
    this.nextEntityIndex = 0
    this.entityTree.nodes.clear()
    this.entityTree.rootNodeIds = []
  }
}
