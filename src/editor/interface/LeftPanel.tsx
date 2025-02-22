import React, { useEffect } from 'react'
import { Tab, Tabs } from '../components/Tabs'
import { useEditor } from '../state/EditorProvider'
import { useSetSelectedSceneId } from '../state/SceneSelectionProvider'
import { SceneImport } from './SceneImport'
import { SceneTree } from './SceneTree'

const tabs: Tab[] = [
  { id: 'scene', displayName: 'Scene', content: <SceneTree /> },
  { id: 'import', displayName: 'Import', content: <SceneImport /> },
]

export function LeftPanel() {
  const editor = useEditor()!
  const setSelectedSceneId = useSetSelectedSceneId()

  useEffect(() => setSelectedSceneId(editor.game.engine.sceneManager.getActiveScene().sceneId), [])

  return (
    <div className="">
      <Tabs tabs={tabs} tabStyle="tabs-lifted" />
    </div>
  )
}
