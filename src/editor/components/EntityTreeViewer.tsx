import React, { useState } from 'react'
import { EntityId, EntityNode } from '../../engine/entity-component-system'

type EntityTree = {
  rootNodeIds: number[]
  nodes: EntityNode[]
}

type Props = {
  entityTree: EntityTree
  setActiveEntityId: (entityId: number) => void
}

type NodeProps = {
  nodeId: EntityId
  nodes: EntityNode[]
  setActiveEntityId: (entityId: number) => void
}

function Node({ nodeId, nodes, setActiveEntityId }: NodeProps) {
  const node = nodes[nodeId]
  const [expanded, setExpanded] = useState<boolean>(false)
  const expandable = node.childIds.length > 0

  return (
    node && (
      <div tabIndex={1} className="">
        <button style={{ visibility: expandable ? 'visible' : 'hidden' }} className="h-5 w-5" onClick={() => setExpanded(!expanded)}>
          {expanded ? '-' : '+'}
        </button>
        <button onClick={() => setActiveEntityId(nodeId)} className="btn btn-ghost btn-xs p-0.5">
          <div className="badge badge-xs bg-primary-200" />
          {node.name || `Entity ${nodeId}`}
        </button>
        {expanded && expandable && (
          <div className="">
            {node.childIds.map((childId) => (
              <div key={childId} className="flex">
                <div className="divider divider-start divider-horizontal -mx-0.5 ml-0.5" />
                <Node nodeId={childId} {...{ nodes, setActiveEntityId }} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  )
}

export function EntityTreeViewer({ entityTree, setActiveEntityId }: Props) {
  return (
    <div className="rounded-xl">
      {entityTree.rootNodeIds.map((nodeId) => (
        <Node key={nodeId} nodes={entityTree.nodes} {...{ nodeId, setActiveEntityId }} />
      ))}
    </div>
  )
}
