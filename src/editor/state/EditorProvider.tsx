import React, { createContext, useContext } from 'react'
import { Editor } from '../Editor'

const EditorContext = createContext<Editor | undefined>(undefined)

type Props = {
  editor: Editor
  children: JSX.Element[] | JSX.Element
}

export function EditorProvider({ editor, children }: Props) {
  return <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>
}

export function useEditor() {
  return useContext(EditorContext)
}
