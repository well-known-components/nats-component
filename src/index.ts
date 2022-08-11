import { IBaseComponent } from "@well-known-components/interfaces"
import { connect, NatsConnection, JSONCodec } from "nats"
// import * as nats from "nats"
import mitt from "mitt"
import { natsComponent, INatsComponent, NatsEvents, Subscription } from "./types"

export { createLocalNatsComponent } from "./test-component"
export { encodeJson, decodeJson } from "./codecs"

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
        logger.debug(`Subscription closed for topic`, { topic })
      })
      .catch((err: any) => {
        logger.error(`Subscription closed with an error`, err)
      })
    return {
      unsubscribe: () => sub.unsubscribe(),
      generator: sub,
    }
  }

  let didStop = false

  async function printStatus(connection: NatsConnection) {
    for await (const s of connection.status()) {
      logger.info(`Status change`, s as any);
    }
  }

  async function start() {
    try {
      natsConnection = await connect({ servers: `${natsUrl}` })
      printStatus(natsConnection).catch(logger.error)

      natsConnection
        .closed()
        .then((err) => {
          if (!didStop) {
            logger.error(`NATS connection lost`)
            if (err) {
              logger.error(err)
            }
            // TODO: gracefully quit, this is an unrecoverable state
            process.exit(1)
          }
        })
      events.emit("connected")
      logger.info(`Connected`, { server: natsConnection.getServer() });
    } catch (error) {
      logger.error(`An error occurred trying to connect to the NATS server: ${natsUrl}`)
      throw error
    }
  }

  async function stop() {
    try {
      if (natsConnection) {
        didStop = true
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
