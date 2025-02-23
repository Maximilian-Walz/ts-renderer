import React from 'react'
import { Tab, Tabs } from '../components/Tabs'
import { Editor } from '../Editor'
import { EditorProvider } from '../state/EditorProvider'
import { EntitySelctionProvider } from '../state/EntitySelectionProvider'
import { SceneSelctionProvider } from '../state/SceneSelectionProvider'
import { GameView } from './GameView'
import { Viewport } from './Viewport'

type Props = {
  editor: Editor
}

const tabs: Tab[] = [
  { id: 'viewport', displayName: 'Viewport', content: <Viewport /> },
  { id: 'game', displayName: 'Game', content: <GameView /> },
]

export function EditorInterface({ editor }: Props) {
  return (
    <EditorProvider editor={editor}>
      <SceneSelctionProvider>
        <EntitySelctionProvider>
          <div className="flex h-full w-full overflow-hidden bg-gray-900">
            <Tabs tabs={tabs} className="flex h-screen w-full flex-col" />
          </div>
        </EntitySelctionProvider>
      </SceneSelctionProvider>
    </EditorProvider>
  )
}
