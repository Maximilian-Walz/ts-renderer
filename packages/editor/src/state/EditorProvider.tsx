import { createContext, ReactNode, useContext } from "react"
import { Editor } from "../../../../packages/editor/src/Editor"

const EditorContext = createContext<Editor | undefined>(undefined)

type Props = {
  editor: Editor
  children: ReactNode[] | ReactNode
}

export function EditorProvider({ editor, children }: Props) {
  return <EditorContext.Provider value={editor}>{children}</EditorContext.Provider>
}

export function useEditor() {
  return useContext(EditorContext)
}

export function useGameSceneManager() {
  return useEditor()!.game.engine.sceneManager
}
