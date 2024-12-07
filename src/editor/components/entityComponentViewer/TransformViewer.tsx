import React, { useContext } from 'react'
import { LuAxis3D, LuMove3D, LuRotate3D, LuScale3D } from 'react-icons/lu'
import { ComponentType, TransformComponent } from '../../../engine/components/components'
import { EditorContext } from '../Editor'
import { LabelInput } from '../data/LabelInput'
import { VectorInput } from '../data/VectorInput'
import { ComponentViewer } from './ComponentViewer'

type Props = {
  entityId: number
  transformData: any
}

export function TransformViewer({ entityId, transformData }: Props) {
  const editor = useContext(EditorContext)
  const getTransform = () => editor?.getComponentByEntityId(entityId, ComponentType.TRANSFORM) as TransformComponent

  const position = [
    { label: 'X', value: transformData.position[0] },
    { label: 'Y', value: transformData.position[1] },
    { label: 'Z', value: transformData.position[2] },
  ]

  const rotation = [
    { label: 'X', value: transformData.rotation[0] },
    { label: 'Y', value: transformData.rotation[1] },
    { label: 'Z', value: transformData.rotation[2] },
    { label: 'W', value: transformData.rotation[3] },
  ]

  const scale = [
    { label: 'X', value: transformData.scale[0] },
    { label: 'Y', value: transformData.scale[1] },
    { label: 'Z', value: transformData.scale[2] },
  ]

  return (
    <ComponentViewer title="Transform" icon={<LuAxis3D />}>
      <div className="join join-vertical space-y-2">
        <div className="self-end">
          <LabelInput label="Name" initialValue={(transformData.name ??= '')} onChange={(value) => (getTransform().name = value)} />
        </div>
        <VectorInput label="Position" icon={<LuMove3D />} initialValue={position} targetValue={() => getTransform().position} />
        <VectorInput label="Rotation" icon={<LuRotate3D />} initialValue={rotation} minValue={-1} maxValue={1} targetValue={() => getTransform().rotation} />
        <VectorInput label="Scale" icon={<LuScale3D />} initialValue={scale} targetValue={() => getTransform().scale} />
      </div>
    </ComponentViewer>
  )
}
