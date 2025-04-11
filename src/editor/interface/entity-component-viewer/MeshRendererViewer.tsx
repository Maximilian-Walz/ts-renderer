import React from 'react'
import { LuBox } from 'react-icons/lu'
import { ComponentType, MeshRendererComponent } from '../../../engine/components'
import { Entity } from '../../../engine/scenes/Entity'
import { ComponentViewer } from './ComponentViewer'

type Props = {
  entity: Entity
}

export function MeshRendererViewer({ entity }: Props) {
  const meshRenderer = entity.getComponentOrUndefined(ComponentType.MESH_RENDERER) as MeshRendererComponent
  if (meshRenderer == undefined) {
    return null
  }

  return <ComponentViewer title="Mesh Renderer" icon={<LuBox />} contentKey={entity.entityId}></ComponentViewer>
}
