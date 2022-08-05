import { JSONCodec } from "nats"

const jsonCodec = JSONCodec()

/**
 * Encode JSON objects into Uint8Array and viceversa
 * @public
 */
export function encodeJson<T = unknown>(d: T): Uint8Array {
  return jsonCodec.encode(d)
}

/**
 * Decode JSON objects into Uint8Array and viceversa
 * @public
 */
export function decodeJson<T = unknown>(a: Uint8Array): T {
  return jsonCodec.decode(a) as T
}
