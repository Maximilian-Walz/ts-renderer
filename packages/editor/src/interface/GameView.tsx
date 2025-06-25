import { useEffect, useRef } from "react"
import { useEditor } from "../state/EditorProvider"

export function GameView() {
  const gameDivRef = useRef<HTMLDivElement>(null)
  const editor = useEditor()

  useEffect(() => {
    if (gameDivRef.current) {
      editor!.onGameDivInitialized(gameDivRef.current)
    }
    return () => editor?.game.engine.abort()
  }, [gameDivRef, editor])

  return <div className="flex min-h-0 grow flex-row" ref={gameDivRef}></div>
}
