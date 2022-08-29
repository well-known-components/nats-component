import { IBaseComponent } from "@well-known-components/interfaces"
import mitt from "mitt"
import { INatsComponent, Subscription, NatsEvents, NatsMsg, SubscriptionCallback } from "./types"

/**
 * Create a local NATS component, for testing purposes
 * @public
 */
export async function createLocalNatsComponent(): Promise<INatsComponent & IBaseComponent> {
  const callbacks = new Map<string, SubscriptionCallback>()
  const events = mitt<NatsEvents>()

  function publish(topic: string, data: Uint8Array): void {
    callbacks.forEach((cb, pattern) => {
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

      cb(null, { subject: topic, data })
    })
  }

  function subscribe(pattern: string, cb: SubscriptionCallback): Subscription {
    callbacks.set(pattern, cb)
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
