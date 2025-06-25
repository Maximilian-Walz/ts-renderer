import { createContext, ReactElement, useContext } from "react"
import { Editor } from "../../../../packages/editor/src/Editor"

const EditorContext = createContext<Editor | undefined>(undefined)

type Props = {
  editor: Editor
  children: ReactElement[] | ReactElement
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
