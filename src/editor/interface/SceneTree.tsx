import React, { useState } from 'react'
import { LuAxis3D, LuBox, LuCamera, LuLightbulb } from 'react-icons/lu'
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md'
import { CameraComponent, HierarchyComponent, LightComponent, MeshRendererComponent } from '../../engine/components'
import { Entity } from '../../engine/scenes/Entity'
import { useSelectedEntityId, useSetSelectedEntityId } from '../state/EntitySelectionProvider'
import { useSelectedScene } from '../state/SceneSelectionProvider'

function getIcon(entity: Entity): JSX.Element {
  if (entity.hasComponent(CameraComponent)) return <LuCamera />
  else if (entity.hasComponent(LightComponent)) return <LuLightbulb />
  else if (entity.hasComponent(MeshRendererComponent)) return <LuBox />
  else return <LuAxis3D />
}

type NodeProps = {
  entity: Entity
  children: Entity[]
}

function Node({ entity, children }: NodeProps) {
  const [expanded, setExpanded] = useState<boolean>(false)

  const expandable = children.length > 0
  const icon = getIcon(entity)

  const selectedEnityId = useSelectedEntityId()
  const setSelectedEntityId = useSetSelectedEntityId()

  const isActive = entity.entityId == selectedEnityId

  return (
    <div tabIndex={1} className="mt-0.5">
      <div className="join items-center">
        <button style={{ visibility: expandable ? 'visible' : 'hidden' }} className="rounded-full hover:bg-gray-700" onClick={() => setExpanded(!expanded)}>
          {expanded ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}
        </button>
        <button
          onClick={() => setSelectedEntityId(entity.entityId)}
          className={`btn btn-ghost btn-xs content-center rounded-full pl-1 pr-2 text-sm ${isActive ? 'bg-primary-500 text-gray-800 hover:bg-primary-400' : 'hover:bg-gray-700'}`}
        >
          <div className={`rounded-full p-1 ${isActive ? 'text-gray-800' : 'text-primary-500'}`}>{icon}</div>
          {entity.entityId}
        </button>
      </div>
      {expanded && expandable && (
        <div>
          {children.map((child, index) => (
            <div key={index} className="flex">
              <div className="divider divider-start divider-horizontal -mr-0.5 ml-0" />
              <Node entity={child} children={child.getComponent(HierarchyComponent).children} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SceneTree() {
  const scene = useSelectedScene()
  if (scene == undefined) {
    return <div>No scene selected</div>
  }

  const roots = scene
    .getEntities()
    .map((entity) => entity.getComponent(HierarchyComponent))
    .filter((hierarchy) => hierarchy.parentId == undefined)

  return (
    <div className="rounded-xl">
      {roots.map((rootHierarchy, index) => (
        <Node key={index} entity={rootHierarchy.entity} children={rootHierarchy.children} />
      ))}
    </div>
  )
}
