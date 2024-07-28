import React, { useContext, useState } from 'react'
import { LuAxis3D, LuBox, LuCamera } from 'react-icons/lu'
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md'
import { ComponentType } from '../../engine/components/components'
import { EntityId, EntityNode } from '../../engine/entity-component-system'
import { EditorContext } from './Editor'

type EntityTree = {
  rootNodeIds: number[]
  nodes: EntityNode[]
}

type Props = {
  entityTree: EntityTree
  activeEntityId: number | null
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
  activeEntityId: number | null
  setActiveEntityId: (entityId: number) => void
}

function Node({ nodeId, nodes, activeEntityId, setActiveEntityId }: NodeProps) {
  const editor = useContext(EditorContext)
  const node = nodes[nodeId]
  const [expanded, setExpanded] = useState<boolean>(false)
  const expandable = node.childIds.length > 0
  const componentTypes = editor!.getComponentTypesByEntityId(nodeId)
  const icon = getIcon(componentTypes)
  const isActive = nodeId == activeEntityId

  const handleDoubleClick = () => {
    if (componentTypes.includes(ComponentType.CAMERA)) {
      editor?.setActiveCamera(nodeId)
    }
  }

  return (
    node && (
      <div tabIndex={1} className="mt-0.5">
        <div className="join items-center">
          <button style={{ visibility: expandable ? 'visible' : 'hidden' }} className="rounded-full hover:bg-gray-700" onClick={() => setExpanded(!expanded)}>
            {expanded ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}
          </button>
          <button
            onClick={() => setActiveEntityId(nodeId)}
            onDoubleClick={handleDoubleClick}
            className={`btn btn-ghost btn-xs content-center rounded-full pl-1 pr-2 text-sm ${isActive ? 'bg-primary-500 text-gray-800 hover:bg-primary-400' : 'hover:bg-gray-700'}`}
          >
            <div className={`rounded-full p-1 ${isActive ? 'text-gray-800' : 'text-primary-500'}`}>{icon}</div>
            {node.name || `Entity ${nodeId}`}
          </button>
        </div>
        {expanded && expandable && (
          <div>
            {node.childIds.map((childId) => (
              <div key={childId} className="flex">
                <div className="divider divider-start divider-horizontal -mr-0.5 ml-0" />
                <Node nodeId={childId} {...{ nodes, activeEntityId, setActiveEntityId }} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  )
}

export function EntityTreeViewer({ entityTree, activeEntityId, setActiveEntityId }: Props) {
  return (
    <div className="rounded-xl">
      {entityTree.rootNodeIds.map((nodeId) => (
        <Node key={nodeId} nodes={entityTree.nodes} {...{ nodeId, activeEntityId, setActiveEntityId }} />
      ))}
    </div>
  )
}
