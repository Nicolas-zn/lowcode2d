/**
 * 全局事件总线
 * 统一管理所有子系统的事件
 */

type EventCallback = (data: any) => void

export class GlobalEventBus {
  private static instance: GlobalEventBus
  private events: Map<string, Set<EventCallback>> = new Map()
  private subsystems: Map<string, any> = new Map()

  private constructor()

  static getInstance(): GlobalEventBus {
    if (!GlobalEventBus.instance) {
      GlobalEventBus.instance = new GlobalEventBus()
    }
    return GlobalEventBus.instance
  }

  // 注册子系统
  registerSubsystem(name: string, subsystem: any): void {
    this.subsystems.set(name, subsystem)
  }

  // 获取子系统
  getSubsystem(name: string): any {
    return this.subsystems.get(name)
  }

  // 订阅事件
  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(callback)
  }

  // 取消订阅
  off(event: string, callback: EventCallback): void {
    this.events.get(event)?.delete(callback)
  }

  // 触发事件
  emit(event: string, data?: any): void {
    this.events.get(event)?.forEach(cb => cb(data))
  }

  // 清空所有事件
  clear(): void {
    this.events.clear()
  }
}

export const globalEventBus = GlobalEventBus.getInstance()
