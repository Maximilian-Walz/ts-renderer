import React, { useContext } from 'react'
import { CameraComponent, ComponentType } from '../../../engine/components'
import { EditorContext } from '../Editor'
import { NumberInput } from '../data/NumberInput'
import { LabelInput } from '../data/LabelInput'
import { ComponentViewer } from './ComponentViewer'
import { LuCamera } from 'react-icons/lu'

type Props = {
  entityId: number
  cameraData: any
}

export function CameraViewer({ entityId, cameraData }: Props) {
  const editor = useContext(EditorContext)
  const getCamera = () => editor?.getComponentByEntityId(entityId, ComponentType.CAMERA) as CameraComponent

  return (
    <ComponentViewer title="Camera" icon={<LuCamera />}>
      <div className="join join-vertical space-y-1">
        <LabelInput label="Name" initialValue={(cameraData.name ??= '')} onChange={(value) => (getCamera().name = value)} />
        <NumberInput label={'Field of View'} initialValue={cameraData.fov} precision={4} step={0.1} onChange={(value) => (getCamera().fov = value)} />
        <NumberInput label={'Aspect Ratio'} initialValue={cameraData.aspect} precision={4} step={0.1} onChange={(value) => (getCamera().aspect = value)} />
        <div className="form-control space-y-0.5">
          <div className="label-text -mb-4">Clip</div>
          <NumberInput label={'Near'} initialValue={cameraData.zNear} precision={4} onChange={(value) => (getCamera().zNear = value)} />
          <NumberInput label={'Far'} initialValue={cameraData.zFar} precision={4} onChange={(value) => (getCamera().zFar = value)} />
        </div>
      </div>
    </ComponentViewer>
  )
}
