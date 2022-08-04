import { IBaseComponent } from "@well-known-components/interfaces"
import { connect, NatsConnection, JSONCodec } from "nats"
// import * as nats from "nats"
import mitt from "mitt"
import { natsComponent, INatsComponent, NatsEvents, Subscription } from "./types"

export { createLocalNatsComponent } from "./test-component"
/**
 * Encode/Decode JSON objects into Uint8Array and viceversa
 * @public
 */
export { JSONCodec }

export { Subscription }

/**
 * Create a NATS component (https://nats.io/)
 * Connect to a NATS node on start(), via the env variable "NATS_URL" or to "localhost:4222" by default
 * @public
 */
export async function createNatsComponent(
  components: natsComponent.NeededComponents
): Promise<INatsComponent & IBaseComponent> {
  const { config, logs } = components
  const logger = logs.getLogger("NATS")

  // config
  const natsUrl = (await config.getString("NATS_URL")) || "localhost:4222"
  let natsConnection: NatsConnection

  const events = mitt<NatsEvents>()

  function publish(topic: string, message?: Uint8Array): void {
    natsConnection.publish(topic, message)
  }

  function subscribe(topic: string): Subscription {
    const sub = natsConnection.subscribe(topic)
    sub.closed
      .then(() => {
        logger.info(`subscription closed for ${topic}`)
      })
      .catch((err: any) => {
        logger.error(`subscription closed with an error ${err.toString()}`)
      })
    return {
      unsubscribe: () => sub.unsubscribe(),
      generator: sub,
    }
  }

  async function start() {
    try {
      natsConnection = await connect({ servers: `${natsUrl}` })
      events.emit("connected")
      logger.info(`Connected to NATS: ${natsUrl}`)
    } catch (error) {
      logger.error(`An error occurred trying to connect to the NATS server: ${natsUrl}`)
      throw error
    }
  }

  async function stop() {
    try {
      await natsConnection.close()
    } catch (error) {
      logger.error(`An error occurred trying to close the connection to the NATS server: ${natsUrl}`)
    }
  }

  return {
    publish,
    subscribe,
    start,
    stop,
    events,
  }
}
