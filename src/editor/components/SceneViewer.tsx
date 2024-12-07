import React, { ChangeEvent, useState } from 'react'
import { Scene } from '../../engine/Engine'

type Props = {
  scenes: Scene[]
  activeSceneIndex: number
  setActiveScene: (sceneIndex: number) => void
}

export function SceneViewer({ scenes, activeSceneIndex, setActiveScene }: Props) {
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<string>(activeSceneIndex.toString())

  const selectScene = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedSceneIndex(event.target.value)
    setActiveScene(Number.parseInt(event.target.value))
  }

  return (
    <div className="form-control">
      <select className="select select-bordered select-sm focus:outline-none" value={selectedSceneIndex} onChange={selectScene}>
        {scenes.map((scene, index) => (
          <option key={index} value={index}>
            {scene.name}
          </option>
        ))}
      </select>
    </div>
  )
}
