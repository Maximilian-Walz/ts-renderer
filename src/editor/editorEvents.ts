import { EventMap } from '../engine/events/EventTypes'
import { Entity } from '../engine/scenes/Entity'

declare module '../engine/events/EventTypes' {
  interface EventMap {
    entitySelect: { entity: Entity }
  }
}
