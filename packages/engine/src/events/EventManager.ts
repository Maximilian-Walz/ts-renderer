import { EventMap, EventOf } from './EventTypes'

type Listener<K extends keyof EventMap> = (event: EventOf<K>) => void

export class EventManager {
  private listeners: {
    [K in keyof EventMap]?: Listener<K>[]
  } = {}

  private queue: EventOf<keyof EventMap>[] = []

  on<K extends keyof EventMap>(type: K, listener: (event: EventOf<K>) => void): void {
    if (!this.listeners[type]) {
      this.listeners[type] = [] as (typeof this.listeners)[K]
    }
    this.listeners[type]!.push(listener)
  }

  off<K extends keyof EventMap>(type: K, listener: Listener<K>): void {
    const listeners = this.listeners[type]
    if (!listeners) return
    this.listeners[type] = listeners.filter((l) => l !== listener) as typeof listeners
  }

  emit<K extends keyof EventMap>(event: EventOf<K>): void {
    this.queue.push(event)
  }

  process(): void {
    while (this.queue.length > 0) {
      const event = this.queue.shift()!
      const type = event.type
      const listeners = this.listeners[type] as ((e: typeof event) => void)[] | undefined

      listeners?.forEach((listener) => {
        listener(event)
      })
    }
  }
}
