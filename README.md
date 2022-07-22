# nats-component

A port used to communicate with [NATS](https://nats.io/), the cloud native messaging system.

## Configuration

-  `NATS_URL` environment variable to connect to the NATS node.

## API

### Create

```typescript
// src/components.ts
await createNatsComponent({ config, logs })
```

### Start

You'd normally won't have to call this function, as that is taken care by the [`Lifecycle.run`](https://github.com/well-known-components/interfaces) method. But the method will:

- Attempt to establish a connection with the NATS node
- Emit a `connected` event if the connection is successful

### Subscribe

Subscribe to a NATS topic

#### Example

```typescript
export async function setupTopics(globalContext: GlobalContext): Promise<void> {
  const { nats } = globalContext.components
  
  // Subscribe to the topic
  const connectSubscription = nats.subscribe('peer.*.connect')
  
  // Process messages received for the topic
  ;(async () => {
    for await (const message of connectSubscription.generator) {
      try {
        // Extract information from the subject for the topic
        // 'peer.837.connect' => '837'
        const id = message.subject.split('.')[1]
        
        // Parse the data from the message. Data is encoded as Uint8Array
        const data = message.data
      } catch (err: any) {
        logger.error(`cannot process peer_connect message ${err.message}`)
      }
    }
  })().catch((err: any) => logger.error(`error processing subscription message; ${err.message}`))
}
```

### Publish

Publish a message to a NATS topic

#### Example

```typescript
export async function setupTopics(globalContext: GlobalContext): Promise<void> {
  const { nats } = globalContext.components
  
  const peerId = '837'
  const payload = ... // Uint8Array
  
  // `payload` is optional
  components.nats.publish(`peer.${peerId.connect`, payload)
}
```

## Encode/Decode

Encode/Decode JSON messages using `JSONCodec`. Any other codec that encodes to `Uint8Array` can be used.

### Example using JSONCodec

```typescript
import { JSONCodec } from '@well-known-components/nats-component'

const jsonCodec = JSONCodec()
const jsonMessage = { id: 1 }

// Encode
const encodedMessage = jsonCodec.encode(jsonMessage)

// Decode
const decodedMessage = jsonCodec.decode(encodedMessage)
```
