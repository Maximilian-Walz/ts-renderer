import React, { useContext } from 'react'
import { LuAxis3D, LuRotateCw } from 'react-icons/lu'
import { AutoRotateComponent, ComponentType } from '../../../engine/components'
import { EditorContext } from '../Editor'
import { NumberInput } from '../data/NumberInput'
import { VectorInput } from '../data/VectorInput'
import { ComponentViewer } from './ComponentViewer'

type Props = {
  entityId: number
  autoRotateData: any
}

export function AutoRotateViewer({ entityId, autoRotateData }: Props) {
  const editor = useContext(EditorContext)
  const getAutoRotate = () => editor?.getComponentByEntityId(entityId, ComponentType.AUTO_ROTATE) as AutoRotateComponent

  const axis = [
    { label: 'X', value: autoRotateData.axis[0] },
    { label: 'Y', value: autoRotateData.axis[1] },
    { label: 'Z', value: autoRotateData.axis[2] },
  ]

  return (
    <ComponentViewer title="Auto Rotate" icon={<LuRotateCw />}>
      <div className="join join-vertical">
        <div className="self-end">
          <NumberInput label="Speed" initialValue={autoRotateData.speed} onChange={(value) => (getAutoRotate().speed = value)} />
        </div>
        <div>
          <VectorInput label="Axis" icon={<LuAxis3D />} initialValue={axis} targetValue={() => getAutoRotate().axis} />
        </div>
      </div>
    </ComponentViewer>
  )
}
