import React, { useContext } from 'react'
import { LuCamera } from 'react-icons/lu'
import { CameraComponent, CameraType, ComponentType, OrthographicData, PerspectiveData } from '../../../engine/components/components'
import { EditorContext } from '../Editor'
import { LabelInput } from '../data/LabelInput'
import { NumberInput } from '../data/NumberInput'
import { ComponentViewer } from './ComponentViewer'

type Props = {
  entityId: number
  cameraData: any
}

function PerspectiveViewer({ cameraData, getCamera }: { cameraData: any; getCamera: () => CameraComponent }) {
  return (
    <>
      <NumberInput label={'Field of View'} initialValue={cameraData.data.fov} precision={4} step={0.1} onChange={(value) => ((getCamera().data as PerspectiveData).fov = value)} />
      {cameraData.useCanvasData && (
        <NumberInput
          label={'Aspect Ratio'}
          initialValue={cameraData.data.aspect}
          precision={4}
          step={0.1}
          onChange={(value) => ((getCamera().data as PerspectiveData).aspect = value)}
        />
      )}
      <div className="form-control space-y-0.5">
        <div className="label-text -mb-4">Clip</div>
        <NumberInput label={'Near'} initialValue={cameraData.zNear} precision={4} onChange={(value) => (getCamera().zNear = value)} />
        <NumberInput label={'Far'} initialValue={cameraData.zFar} precision={4} onChange={(value) => (getCamera().zFar = value)} />
      </div>
    </>
  )
}

function OrthographicViewer({ cameraData, getCamera }: { cameraData: any; getCamera: () => CameraComponent }) {
  return (
    <>
      <NumberInput label={'xMag'} initialValue={cameraData.data.xMag} precision={4} step={0.1} onChange={(value) => ((getCamera().data as OrthographicData).xMag = value)} />
      <NumberInput label={'yMag'} initialValue={cameraData.data.yMag} precision={4} step={0.1} onChange={(value) => ((getCamera().data as OrthographicData).yMag = value)} />
      <div className="form-control space-y-0.5">
        <div className="label-text -mb-4">Clip</div>
        <NumberInput label={'Near'} initialValue={cameraData.zNear} precision={4} onChange={(value) => (getCamera().zNear = value)} />
        <NumberInput label={'Far'} initialValue={cameraData.zFar} precision={4} onChange={(value) => (getCamera().zFar = value)} />
      </div>
    </>
  )
}

export function CameraViewer({ entityId, cameraData }: Props) {
  const editor = useContext(EditorContext)
  const getCamera = () => editor?.getComponentByEntityId(entityId, ComponentType.CAMERA) as CameraComponent

  const cameraSwitch = (cameraType: CameraType) => {
    switch (cameraType) {
      case CameraType.PERSPECTIVE:
        return <PerspectiveViewer cameraData={cameraData} getCamera={getCamera} />
      case CameraType.ORTHOGRAPHIC:
        return <OrthographicViewer cameraData={cameraData} getCamera={getCamera} />
    }
  }

  return (
    <ComponentViewer title="Camera" icon={<LuCamera />}>
      <div className="join join-vertical space-y-1">
        <LabelInput label="Name" initialValue={(cameraData.name ??= '')} onChange={(value) => (getCamera().name = value)} />
        {cameraSwitch(cameraData.cameraType)}
      </div>
    </ComponentViewer>
  )
}
