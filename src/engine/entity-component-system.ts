import { TransformComponent } from './components'

export type EntityId = number
type ArchetypeIndex = number

export enum ComponentType {
  TRANSFORM,
  CAMERA,
  MESH_RENDERER,
  AUTO_ROTATE,
}

export abstract class Component {
  type: ComponentType

  constructor(type: ComponentType) {
    this.type = type
  }
}

export class Archetype {
  entities: EntityId[] = []
  columns: Component[][] = []
  componentTypeToIndices: Map<ComponentType, number> = new Map()
}

export type EntityTree = {
  rootNodes: EntityId[]
  childMap: Map<EntityId, EntityId[]>
}

export interface EntityComponentSystem {
  createEntity(tranform: TransformComponent): EntityId
  addComponentToEntity(entityId: EntityId, component: Component): void
  getComponentsAsTuple(componentTypes: ComponentType[]): Component[][]
  getEntityTree(): EntityTree
  getComponentsByEntityId(entityId: EntityId): Component[]
  getEntityComponentMap(): Map<EntityId, Component[]>
}

export class ArchetypeECS implements EntityComponentSystem {
  private archetypes: Archetype[] = []
  private lastEntityId: EntityId = 0
  private entityToArchetypeIndex: ArchetypeIndex[] = []
  private cachedQueries: Map<string, Archetype[]> = new Map()
  private entityTree: EntityTree = { rootNodes: [], childMap: new Map() }

  createEntity(tranform: TransformComponent): EntityId {
    this.lastEntityId++
    tranform.entityId = this.lastEntityId
    if (!tranform.parent) {
      this.entityTree.rootNodes.push(this.lastEntityId)
    } else if (this.entityTree.childMap.has(tranform.parent.entityId!)) {
      this.entityTree.childMap.get(tranform.parent.entityId!)
    } else {
      this.entityTree.childMap.set(tranform.parent.entityId!, [this.lastEntityId])
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
}
