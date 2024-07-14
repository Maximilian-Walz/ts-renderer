import React, { useContext } from 'react'
import { LuBox } from 'react-icons/lu'
import { ComponentType, MeshRendererComponent } from '../../../engine/components'
import { EditorContext } from '../Editor'
import { LabelInput } from '../data/LabelInput'
import { ComponentViewer } from './ComponentViewer'

type Props = {
  entityId: number
  meshRendererData: any
}

export function MeshRendererViewer({ entityId, meshRendererData }: Props) {
  const editor = useContext(EditorContext)

  const getMeshRenderer = () => {
    console.log('update')
    return editor?.getComponentByEntityId(entityId, ComponentType.MESH_RENDERER) as MeshRendererComponent
  }

  return (
    <ComponentViewer title="Mesh Renderer" icon={<LuBox />}>
      <div className="join join-vertical">
        <div className="self-end">
          <LabelInput label="Name" initialValue={(meshRendererData.name ??= '')} onChange={(value) => (getMeshRenderer().name = value)} />
        </div>
      </div>
    </ComponentViewer>
  )
}
