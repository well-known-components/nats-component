import { test } from "./components"

test("smoke test", function ({ components }) {
  it("smoke test", async () => {
    const { nats } = components
    expect(nats).toBeTruthy()
  })
})
