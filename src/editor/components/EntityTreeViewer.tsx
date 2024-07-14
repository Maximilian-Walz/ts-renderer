import React, { useContext, useState } from 'react'
import { EntityId, EntityNode } from '../../engine/entity-component-system'
import { LuAxis3D, LuBox, LuCamera } from 'react-icons/lu'
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md'
import { EditorContext } from './Editor'
import { ComponentType } from '../../engine/components'

type EntityTree = {
  rootNodeIds: number[]
  nodes: EntityNode[]
}

type Props = {
  entityTree: EntityTree
  setActiveEntityId: (entityId: number) => void
}

function getIcon(componentTypes: ComponentType[]): JSX.Element {
  if (componentTypes.includes(ComponentType.CAMERA)) return <LuCamera />
  else if (componentTypes.includes(ComponentType.MESH_RENDERER)) return <LuBox />
  else return <LuAxis3D />
}

type NodeProps = {
  nodeId: EntityId
  nodes: EntityNode[]
  setActiveEntityId: (entityId: number) => void
}

function Node({ nodeId, nodes, setActiveEntityId }: NodeProps) {
  const editor = useContext(EditorContext)
  const node = nodes[nodeId]
  const [expanded, setExpanded] = useState<boolean>(false)
  const expandable = node.childIds.length > 0

  const icon = getIcon(editor!.getComponentTypesByEntityId(nodeId))

  return (
    node && (
      <div tabIndex={1} className="mt-0.5">
        <div className="join items-center">
          <button style={{ visibility: expandable ? 'visible' : 'hidden' }} className="mr-1 rounded-full hover:bg-gray-700" onClick={() => setExpanded(!expanded)}>
            {expanded ? <MdKeyboardArrowUp /> : <MdKeyboardArrowDown />}
          </button>
          <button onClick={() => setActiveEntityId(nodeId)} className="btn btn-ghost btn-xs content-center rounded-full px-1 text-sm hover:bg-gray-700">
            <div className="rounded-full px-0 text-primary-500">{icon}</div>
            {node.name || `Entity ${nodeId}`}
          </button>
        </div>
        {expanded && expandable && (
          <div>
            {node.childIds.map((childId) => (
              <div key={childId} className="flex">
                <div className="divider divider-start divider-horizontal -mr-0.5 ml-0" />
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
