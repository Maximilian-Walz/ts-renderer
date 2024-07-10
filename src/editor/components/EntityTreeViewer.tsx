import React from 'react'
import { EntityId, EntityNode } from '../../engine/entity-component-system'

type EntityTree = {
  rootNodeIds: number[]
  nodes: EntityNode[]
}

type Props = {
  entityTree: EntityTree
}

type NodeProps = {
  nodeId: EntityId
  nodes: EntityNode[]
}

function Node({ nodeId, nodes }: NodeProps) {
  const node = nodes[nodeId]
  return (
    node && (
      <div>
        {node.name || nodeId}
        {node.childIds.map((childId) => (
          <div className="ml-3" key={childId}>
            <Node nodeId={childId} nodes={nodes} />
          </div>
        ))}
      </div>
    )
  )
}

export function EntityTreeViewer({ entityTree }: Props) {
  return (
    <div className="m-2 rounded-xl bg-gray-800 p-5">
      {entityTree.rootNodeIds.map((nodeId) => (
        <Node key={nodeId} nodeId={nodeId} nodes={entityTree.nodes} />
      ))}
    </div>
  )
}
