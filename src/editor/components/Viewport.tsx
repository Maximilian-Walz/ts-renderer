import React, { useContext } from 'react'
import { EditorContext } from './Editor'

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function Viewport({ canvasRef }: Props) {
  const editor = useContext(EditorContext)
  const isTrackPad = (event: React.WheelEvent<HTMLCanvasElement>) => {
    const { deltaY } = event
    if (deltaY && !Number.isInteger(deltaY)) {
      return false
    }
    return true
  }

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.buttons == 1) {
      if (event.shiftKey) {
        editor?.applyCameraPan(event.movementX, event.movementY)
      } else {
        editor?.applyCameraRotation(event.movementX * 5, event.movementY * 5)
      }
    }
  }

  const handleCanvasWheelMove = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (isTrackPad(event)) {
      if (event.shiftKey) {
        //editor?.applyCameraPan(-event.deltaX, -event.deltaY)
      } else {
        editor?.applyCameraScale(event.deltaY)
        //editor?.applyCameraRotation(-event.deltaX, -event.deltaY)
      }
    } else {
      // TODO: Implement behaviour with mouse
    }
  }
  return <canvas onMouseMove={(event) => handleCanvasMouseMove(event)} onWheel={(event) => handleCanvasWheelMove(event)} className="h-full w-full" ref={canvasRef}></canvas>
}
