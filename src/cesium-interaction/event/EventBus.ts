/**
 * EventBus - 事件总线
 */

type EventCallback = (data: any) => void

export class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map()

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(callback)
  }

  off(event: string, callback: EventCallback): void {
    this.events.get(event)?.delete(callback)
  }

  emit(event: string, data?: any): void {
    this.events.get(event)?.forEach(cb => cb(data))
  }

  clear(): void {
    this.events.clear()
  }
}
