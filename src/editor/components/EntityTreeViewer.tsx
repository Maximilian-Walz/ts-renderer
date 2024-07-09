import React from 'react'
import { EntityId, EntityTree, Component, ComponentType } from '../../engine/entity-component-system'
import { TransformComponent } from '../../engine/components'

type Props = {
  entityTree: EntityTree
  entityComponentMap: Map<EntityId, Component[]>
}

type NodeProps = {
  nodeId: EntityId
  childMap: Map<EntityId, EntityId[]>
  entityComponentMap: Map<EntityId, Component[]>
}

function Node({ nodeId, childMap, entityComponentMap }: NodeProps) {
  const children = childMap.get(nodeId) ?? []
  return (
    <div>
      {(entityComponentMap.get(nodeId)?.find((component) => component.type == ComponentType.TRANSFORM) as TransformComponent).name}
      {children.map((childId) => (
        <div className="ml-3" key={nodeId}>
          <Node nodeId={childId} childMap={childMap} entityComponentMap={entityComponentMap}></Node>
        </div>
      ))}
    </div>
  )
}

export function EntityTreeViewer({ entityTree, entityComponentMap }: Props) {
  console.log(entityTree)
  return (
    <div className="m-2 rounded-xl bg-gray-800 p-5">
      {entityTree.rootNodes.map((nodeId) => (
        <Node key={nodeId} nodeId={nodeId} childMap={entityTree.childMap} entityComponentMap={entityComponentMap} />
      ))}
    </div>
  )
}
