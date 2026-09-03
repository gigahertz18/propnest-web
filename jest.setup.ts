import "@testing-library/jest-dom"
import { act } from "@testing-library/react"
import { configure } from "@testing-library/dom"

// Base UI's Combobox/Select popups are CPU-bound-slow to open under jsdom
// (tens of seconds, not a hang) — well past the default 1000ms `waitFor`/
// `findBy*` polling timeout.
configure({ asyncUtilTimeout: 20000 })

Object.defineProperty(URL, "createObjectURL", {
  writable: true,
  value: jest.fn(() => "blob:mock-url"),
})

Object.defineProperty(URL, "revokeObjectURL", {
  writable: true,
  value: jest.fn(),
})

// Base UI (Select, Menu, Tooltip, etc.) needs these in jsdom.
// Skip entirely in the "node" test environment (e.g. Route Handler tests),
// where `window` doesn't exist.
if (typeof window !== "undefined") {
  if (!window.PointerEvent) {
    class PointerEvent extends MouseEvent {}
    // @ts-expect-error - jsdom polyfill
    window.PointerEvent = PointerEvent
  }
  Element.prototype.hasPointerCapture = jest.fn().mockReturnValue(false)
  Element.prototype.releasePointerCapture = jest.fn()
  Element.prototype.scrollIntoView = jest.fn()

  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Flush any pending microtasks (e.g. effects whose promise chains resolve
  // after the test body finishes) before the next test starts. A macrotask
  // tick (setTimeout) fully drains the microtask queue first, which a bare
  // `await Promise.resolve()` does not guarantee for multi-hop chains
  // like `.then().catch().finally()`.
  afterEach(async () => {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })
  })
}
