import React, { useState } from 'react'
import { LuAxis3D, LuBox, LuCamera, LuLightbulb } from 'react-icons/lu'
import { MdKeyboardArrowDown, MdKeyboardArrowRight } from 'react-icons/md'
import { ComponentType, TransformComponent } from '../../engine/components'
import { Entity } from '../../engine/scenes/Entity'
import { useEditor } from '../state/EditorProvider'
import { useSelectedEntityId, useSetSelectedEntityId } from '../state/EntitySelectionProvider'
import { useSelectedScene } from '../state/SceneSelectionProvider'

function getIcon(entity: Entity): JSX.Element {
  if (entity.hasComponent(ComponentType.CAMERA)) return <LuCamera />
  else if (entity.hasComponent(ComponentType.LIGHT)) return <LuLightbulb />
  else if (entity.hasComponent(ComponentType.MESH_RENDERER)) return <LuBox />
  else return <LuAxis3D />
}

type NodeProps = {
  entity: Entity
  childrenMap: Map<TransformComponent, Entity[]>
}

function Node({ entity, childrenMap }: NodeProps) {
  const [expanded, setExpanded] = useState<boolean>(false)
  const transform = entity.getComponent(ComponentType.TRANSFORM) as TransformComponent
  const expandable = childrenMap.get(transform) != undefined
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
          {transform.name || entity.entityId}
        </button>
      </div>
      {expanded && expandable && (
        <div>
          {childrenMap.get(transform)!.map((_, index) => (
            <div key={index} className="flex">
              <div className="divider divider-start divider-horizontal -mr-0.5 ml-0" />
              <Node {...{ entity, childrenMap }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SceneTree() {
  const editor = useEditor()

  const rootEntities: Entity[] = []
  const childrenMap: Map<TransformComponent, Entity[]> = new Map()

  const scene = useSelectedScene()
  if (scene == undefined) {
    return <div>No scene selected</div>
  }

  const entities = scene.getEntities()
  Array.from(entities.values()).forEach((entity) => {
    const parent = (entity.getComponent(ComponentType.TRANSFORM) as TransformComponent).parent
    if (parent == undefined) {
      rootEntities.push(entity)
    } else {
      if (!childrenMap.has(parent)) {
        childrenMap.set(parent, [])
      }
      childrenMap.get(parent)?.push(entity)
    }
  })

  return (
    <div className="rounded-xl">
      {rootEntities.map((entity, index) => (
        <Node key={index} {...{ entity, childrenMap }} />
      ))}
    </div>
  )
}
