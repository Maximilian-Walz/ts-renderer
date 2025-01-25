import React, { useContext } from 'react'
import { LuLightbulb, LuPalette } from 'react-icons/lu'
import { ComponentType, LightComponent } from '../../../engine/components'
import { EditorContext } from '../Editor'
import { NumberInput } from '../data/NumberInput'
import { VectorInput } from '../data/VectorInput'
import { ComponentViewer } from './ComponentViewer'

type Props = {
  entityId: number
  lightData: any
}

export function LightViewer({ entityId, lightData }: Props) {
  const editor = useContext(EditorContext)
  const getLight = () => editor?.getComponentByEntityId(entityId, ComponentType.LIGHT) as LightComponent

  const color = [
    { label: 'R', value: lightData.color[0] },
    { label: 'G', value: lightData.color[1] },
    { label: 'B', value: lightData.color[2] },
  ]

  return (
    <ComponentViewer title="Light" icon={<LuLightbulb />}>
      <div className="self-end">
        <NumberInput label="Power" initialValue={lightData.power} minValue={0} onChange={(value) => (getLight().power = value)} />
      </div>
      <VectorInput label="Color" icon={<LuPalette />} initialValue={color} minValue={0} maxValue={1} targetValue={() => getLight().color} />
    </ComponentViewer>
  )
}
