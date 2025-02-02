import React, { createContext } from 'react'
import { Editor } from '../Editor'
import { GameView } from './GamView'
import { Viewport } from './Viewport'

export const EditorContext = createContext<Editor | undefined>(undefined)

type Props = {
  editor: Editor
}

export function EditorInterface({ editor }: Props) {
  return (
    <div className="relative h-full w-full">
      <EditorContext.Provider value={editor}>
        <Viewport />
        <GameView />
      </EditorContext.Provider>
    </div>
  )
}
