interface HandlerFunction {
  (...args: unknown[]): unknown
}

class Handler {
  public f: HandlerFunction
  public once: boolean
  public priority: number

  constructor(f: HandlerFunction, once: boolean, priority: number) {
    this.f = f
    this.once = once
    this.priority = priority
  }
}

class Subscription {
  public handlers: Handler[] = []

  public add(f: HandlerFunction, priority: number = 0): void {
    const handler = new Handler(f, false, priority)
    this.insert(handler)
  }

  public addOnce(f: HandlerFunction, priority: number = 0): void {
    const handler = new Handler(f, true, priority)
    this.insert(handler)
  }

  public remove(f: HandlerFunction): void {
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
    for (const handler of handlers) {
      handler.f.apply(null, args)
    }
  }

  protected handlersForDispatch(): Handler[] {
    const handlers = this.handlers
    const updated: Handler[] = []
    for (let i = handlers.length - 1; i >= 0; i--) {
      if (handlers[i].once) {
        // Skip once handlers in the dispatch list
      } else {
        updated.unshift(handlers[i])
      }
    }
    // Remove once handlers from the main list
    this.handlers = this.handlers.filter(h => !h.once)
    return updated
  }

  private insert(handler: Handler): void {
    let pos = 0
    for (; pos < this.handlers.length; pos++) {
      if (this.handlers[pos].priority < handler.priority) break
    }
    this.handlers.splice(pos, 0, handler)
  }
}

class PipelineSubscription extends Subscription {
  public dispatch(value: unknown): unknown {
    const handlers = this.handlersForDispatch()
    for (const handler of handlers) {
      value = handler.f(value)
    }
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
    return undefined
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
