import { IConfigComponent, ILoggerComponent } from "@well-known-components/interfaces"
import { Emitter } from "mitt"

export namespace natsComponent {
  export type NeededComponents = {
    logs: ILoggerComponent
    config: IConfigComponent
  }
}

export type NatsMsg = {
  subject: string
  data: Uint8Array
}

/**
 * A Nats subscription
 * @public
 */
export type Subscription = {
  unsubscribe: () => void
}

/**
 * Subscription Callback
 * @public
 */
export type SubscriptionCallback = (error: Error | null, msg: NatsMsg) => void

export type NatsEvents = {
  connected: void
}

export type INatsComponent = {
  publish(topic: string, message?: Uint8Array): void
  subscribe(topic: string, cb: SubscriptionCallback): Subscription

  start(): Promise<void>
  stop(): Promise<void>

  events: Emitter<NatsEvents>
}
