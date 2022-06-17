import { IBaseComponent } from "@well-known-components/interfaces"
import { connect, NatsConnection } from "nats"
import mitt from "mitt"
import { natsComponent, INatsComponent, NatsEvents, Subscription, NatsMsg } from "./types"

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
  const natsConfig = { servers: `${natsUrl}` }
  let natsConnection: NatsConnection

  const events = mitt<NatsEvents>()

  function publish(topic: string, message?: Uint8Array): void {
    natsConnection.publish(topic, message)
  }

  function subscribe(topic: string, onMessage: (_: NatsMsg) => Promise<void>): Subscription {
    const sub = natsConnection.subscribe(topic)
    ;(async () => {
      for await (const message of sub) {
        await onMessage({ data: message.data, subject: message.subject })
      }
    })().catch((err: any) => logger.error(`error processing subscription message; ${err.message}`))

    sub.closed
      .then(() => {
        logger.info(`subscription closed for ${topic}`)
      })
      .catch((err) => {
        logger.error(`subscription closed with an error ${err.message}`)
      })
    return {
      unsubscribe: () => sub.unsubscribe(),
    }
  }

  async function start() {
    try {
      natsConnection = await connect(natsConfig)
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
