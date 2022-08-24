import { IBaseComponent } from "@well-known-components/interfaces"
import { pushableChannel } from "@well-known-components/pushable-channel"
import mitt from "mitt"
import { INatsComponent, Subscription, NatsEvents, NatsMsg } from "./types"

type PushableChannel = {
  push: (value: NatsMsg, resolve: (err?: any) => void) => void
}

/**
 * Create a local NATS component, for testing purposes
 * @public
 */
export async function createLocalNatsComponent(): Promise<INatsComponent & IBaseComponent> {
  const channels = new Map<string, PushableChannel>()
  const events = mitt<NatsEvents>()

  function publish(topic: string, data: Uint8Array): void {
    channels.forEach((ch, pattern) => {
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

      ch.push({ subject: topic, data }, console.log)
    })
  }

  function subscribe(pattern: string): Subscription {
    const channel = pushableChannel<NatsMsg>(function deferCloseChannel() {
      channels.delete(pattern)
    })
    channels.set(pattern, channel)
    return {
      unsubscribe: () => channel.close(),
      generator: channel.iterable,
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
