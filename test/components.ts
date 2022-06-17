// This file is the "test-environment" analogous for src/components.ts
// Here we define the test components to be used in the testing environment

import { ILoggerComponent } from "@well-known-components/interfaces"
import { createRunner } from "@well-known-components/test-helpers"
import { createConfigComponent } from "@well-known-components/env-config-provider"
import { INatsComponent, natsComponent } from "../src/types"
import { createLocalNatsComponent } from "../src/test-component"

export type TestComponents = natsComponent.NeededComponents & { nats: INatsComponent }

export const logger = {
  log: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
}
function createTestConsoleLogComponent(): ILoggerComponent {
  return {
    getLogger: () => logger,
  }
}

/**
 * Behaves like Jest "describe" function, used to describe a test for a
 * use case, it creates a whole new program and components to run an
 * isolated test.
 *
 * State is persistent within the steps of the test.
 */
export const test = createRunner<TestComponents>({
  async main({ startComponents }) {
    await startComponents()
  },
  async initComponents(): Promise<TestComponents> {
    const config = createConfigComponent(process.env)

    const logs = createTestConsoleLogComponent()

    const nats = await createLocalNatsComponent({ config, logs })

    return {
      config,
      logs,
      nats,
    }
  },
})
