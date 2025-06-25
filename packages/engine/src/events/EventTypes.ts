import { LogEvent } from './LogEvent'

export interface EventMap {
  log: LogEvent
}

export type EventOf<K extends keyof EventMap> = {
  type: K
} & EventMap[K]
