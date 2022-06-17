import { IBaseComponent, IConfigComponent } from "@well-known-components/interfaces"
const { connect } = require("mock-nats-client")
import { natsComponent, INatsComponent, Subscription, NatsEvents } from "./types"
import mitt from "mitt"

export async function createLocalNatsComponent(
  components: natsComponent.NeededComponents
): Promise<INatsComponent & IBaseComponent> {
  const events = mitt<NatsEvents>()
  const client = connect({ preserveBuffers: true })

  function publish(topic: string, message: any): void {
    message ? client.publish(topic, message) : client.publish(topic, [])
  }

  function subscribe(topic: string): Subscription {
    const sub = client.subscribe(topic)
    return {
      unsubscribe: () => client.unsubscribe(sub),
      generator: sub,
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
