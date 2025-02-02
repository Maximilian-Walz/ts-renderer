import React from 'react'
import { createRoot } from 'react-dom/client'
import { EditorInterface } from './components/EditorInterface'
import { Editor } from './Editor'
import './index.css'

const init = async () => {
  let device
  if (!navigator.gpu) {
    throw new Error('WebGPU not supported on this browser.')
  }
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) {
    throw new Error('No appropriate GPUAdapter found.')
  }
  device = await adapter.requestDevice()
  device.lost.then(async (info) => {
    console.error(`WebGPU device was lost: ${info.message}`)
    if (info.reason !== 'destroyed') {
      init()
    }
  })

  const editor = new Editor()
  await editor.init(device)
  await editor.loadGame(device)
  createRoot(document.getElementById('editor')!).render(<EditorInterface editor={editor} />)
}
init()
