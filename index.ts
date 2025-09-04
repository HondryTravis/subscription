// callback 定义
interface Callback {
  (...args: unknown[]): unknown
}

class CallbackEntry {
  public f: Callback
  public once: boolean
  public priority: number

  constructor(f: Callback, once: boolean, priority: number) {
    this.f = f
    this.once = once
    this.priority = priority
  }
}

class Subscription {
  public handlers: CallbackEntry[] = []

  public add(f: Callback, priority: number = 0): void {
    this.insert(new CallbackEntry(f, false, priority))
  }

  public addOnce(f: Callback, priority: number = 0): void {
    this.insert(new CallbackEntry(f, true, priority))
  }

  public remove(f: Callback): void {
    for (let i = 0; i < this.handlers.length; i++) {
      if (this.handlers[i].f === f) {
        this.handlers.splice(i, 1)
        return
      }
    }
  }

  public hasHandler(): boolean {
    return this.handlers.length > 0
  }

  public dispatch(...args: unknown[]): void {
    const handlers = this.handlersForDispatch()
    for (const handler of handlers) handler.f.apply(null, args)
  }

  protected handlersForDispatch(): CallbackEntry[] {
    const handlers = this.handlers
    let updated: CallbackEntry[] | null = null
    for (let i = handlers.length - 1; i >= 0; i--) {
      if (handlers[i].once) {
        if (!updated) updated = handlers.slice()
        updated.splice(i, 1)
      }
    }
    if (updated) this.handlers = updated
    return handlers
  }

  private insert(handler: CallbackEntry): void {
    let pos = 0
    for (; pos < this.handlers.length; pos++) if (this.handlers[pos].priority < handler.priority) break
    this.handlers.splice(pos, 0, handler)
  }
}

class PipelineSubscription extends Subscription {
  public dispatch(value: unknown): unknown {
    const handlers = this.handlersForDispatch()
    for (const handler of handlers) value = handler.f(value)
    return value
  }
}

class StoppableSubscription extends Subscription {
  public dispatch(...args: unknown[]): unknown {
    const handlers = this.handlersForDispatch()
    for (const handler of handlers) {
      const result = handler.f.apply(null, args)
      if (result) return result
    }
    return void 0
  }
}

class DOMSubscription extends Subscription {
  public dispatch(event: Event): boolean {
    const handlers = this.handlersForDispatch()
    for (const handler of handlers) {
      if (handler.f(event) || event.defaultPrevented) return true
    }
    return false
  }
}

export { Subscription, PipelineSubscription, StoppableSubscription, DOMSubscription }
