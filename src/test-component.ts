import { IBaseComponent, IConfigComponent } from "@well-known-components/interfaces"
const { connect } = require("mock-nats-client")
import { natsComponent, INatsComponent, Subscription, NatsEvents, NatsMsg } from "./types"
import mitt from "mitt"

export async function createLocalNatsComponent(
  components: natsComponent.NeededComponents
): Promise<INatsComponent & IBaseComponent> {
  const events = mitt<NatsEvents>()
  const client = connect({ preserveBuffers: true })

  function publish(topic: string, message: any): void {
    message ? client.publish(topic, message) : client.publish(topic, [])
  }

  function subscribe(topic: string, onMessage: (_: NatsMsg) => Promise<void>): Subscription {
    const sid = client.subscribe(topic, (delivery: any, _replyTo: any, subject: string) => {
      onMessage({ data: delivery, subject })
    })
    const unsubscribe = () => {
      client.unsubscribe(sid)
    }
    return { unsubscribe }
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
