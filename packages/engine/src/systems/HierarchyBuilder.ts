import { mat4 } from 'wgpu-matrix'
import { HierarchyComponent, TransformComponent } from '../components'
import { EntityId } from '../scenes/Entity'
import { Scene } from '../scenes/Scene'

export type HierarchyData = {
  transform: TransformComponent
  hierarchy: HierarchyComponent
}

export class HierarchyBuilder {
  private parentToChildren: Map<EntityId, TransformComponent[]> = new Map()
  private rootTransforms: TransformComponent[] = []

  public rebuildHierarchy(activeScene: Scene, hierarchiesData: HierarchyData[]): void {
    this.parentToChildren.clear()

    hierarchiesData.forEach(({ hierarchy }) => {
      hierarchy.children = []
    })

    hierarchiesData.forEach(({ hierarchy, transform }) => {
      if (hierarchy.parentId == undefined) {
        this.rootTransforms.push(transform)
      } else {
        const parent = activeScene.getEntity(hierarchy.parentId)
        hierarchy.parent = parent
        parent.getComponent(HierarchyComponent).children.push(hierarchy.entity)

        if (this.parentToChildren.has(hierarchy.parentId)) {
          this.parentToChildren.get(hierarchy.parentId)!.push(transform)
        } else {
          this.parentToChildren.set(hierarchy.parentId, [transform])
        }
      }
    })

    this.updateGlobalTransforms()
  }

  public updateGlobalTransforms() {
    this.rootTransforms.forEach((rootTransforms) => {
      rootTransforms.globalTransform = rootTransforms.toMatrix()
      this.calculateGlobalTransform(rootTransforms)
    })
  }

  private calculateGlobalTransform(parentTransform: TransformComponent) {
    this.parentToChildren.get(parentTransform.entity.entityId)?.forEach((childTransform) => {
      childTransform.globalTransform = mat4.multiply(parentTransform.globalTransform, childTransform.toMatrix())
      this.calculateGlobalTransform(childTransform)
    })
  }
}
