import React from 'react'
import { Tab, Tabs } from '../components/Tabs'
import { Editor } from '../Editor'
import { EditorProvider } from '../state/EditorProvider'
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
      <div className="flex h-full w-full flex-col bg-gray-900">
        <Tabs tabs={tabs} className="flex grow flex-col" />
      </div>
    </EditorProvider>
  )
}
