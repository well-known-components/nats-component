import { IBaseComponent } from "@well-known-components/interfaces"
import { connect, NatsConnection, JSONCodec } from "nats"
// import * as nats from "nats"
import mitt from "mitt"
import { natsComponent, INatsComponent, NatsEvents, Subscription } from "./types"

export { createLocalNatsComponent } from "./test-component"
export { encodeJson, decodeJson } from './codecs'

export { Subscription }

/**
 * Create a NATS component (https://nats.io/)
 * Connect to a NATS node on start(), via the env variable "NATS_URL"
 * @public
 */
export async function createNatsComponent(
  components: natsComponent.NeededComponents
): Promise<INatsComponent & IBaseComponent> {
  const { config, logs } = components
  // config
  const natsUrl = await config.requireString("NATS_URL")
  const logger = logs.getLogger(`NATS(${natsUrl})`)

  let natsConnection: NatsConnection | undefined

  const events = mitt<NatsEvents>()

  function publish(topic: string, message?: Uint8Array): void {
    if (!natsConnection) {
      throw new Error("NATS component was not started yet")
    }
    natsConnection.publish(topic, message)
  }

  function subscribe(topic: string): Subscription {
    if (!natsConnection) {
      throw new Error("NATS component was not started yet")
    }

    const sub = natsConnection.subscribe(topic)
    sub.closed
      .then(() => {
        logger.info(`subscription closed for topic`, { topic })
      })
      .catch((err: any) => {
        logger.error(`subscription closed with an error`, err)
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
      if (natsConnection) {
        await natsConnection.close()
      }
    } catch (error: any) {
      logger.error(error)
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
