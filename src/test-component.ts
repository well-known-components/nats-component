import { IBaseComponent } from "@well-known-components/interfaces"
import mitt from "mitt"
import { INatsComponent, Subscription, NatsEvents, SubscriptionCallback } from "./types"

/**
 * Create a local NATS component, for testing purposes
 * @public
 */
export async function createLocalNatsComponent(): Promise<INatsComponent & IBaseComponent> {
  const callbacks = new Map<string, Set<SubscriptionCallback>>()
  const events = mitt<NatsEvents>()

  function publish(topic: string, data: Uint8Array): void {
    callbacks.forEach((cbs, pattern) => {
      const sPattern = pattern.split(".")
      const sTopic = topic.split(".")

      if (sPattern.length !== sTopic.length) {
        return
      }

      for (let i = 0; i < sTopic.length; i++) {
        if (sPattern[i] !== "*" && sPattern[i] !== sTopic[i]) {
          return
        }
      }

      for (const cb of cbs) {
        cb(null, { subject: topic, data })
      }
    })
  }

  function subscribe(pattern: string, cb: SubscriptionCallback): Subscription {
    const cbs = callbacks.get(pattern) || new Set<SubscriptionCallback>()
    cbs.add(cb)
    callbacks.set(pattern, cbs)
    return {
      unsubscribe: () => false,
    }
  }

  async function start() {
    events.emit("connected")
  }

  async function stop() {}

  return {
    publish,
    subscribe,
    start,
    stop,
    events,
  }
}
