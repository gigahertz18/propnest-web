import "@testing-library/jest-dom"
import { act } from "@testing-library/react"
import { configure } from "@testing-library/dom"

// Modest headroom over the default 1000ms for CI's slower shared runners.
configure({ asyncUtilTimeout: 5000 })

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

  // Works around a pathological slowdown in jsdom 20's selector engine
  // (nwsapi): opening a Base UI Combobox/Select popup (a single userEvent
  // click) was measured to call `element.matches(":fullscreen")` 68M+ times
  // and `element.matches(":modal")` ~67K times — turning a ~50ms interaction
  // into 20+ seconds (confirmed via `node --cpu-prof`; all other selectors
  // matched were negligible in comparison). This traces to nwsapi's `isModal`/
  // `isFullscreen` state checks (nwsapi.js), which Base UI's floating-ui-based
  // popup positioning/dismiss logic ends up triggering on every render while
  // the popup is open. jsdom never actually enters fullscreen or has native
  // <dialog> modal state in tests, so short-circuiting these three
  // pseudo-classes to `false` is behaviorally identical to what jsdom would
  // eventually resolve, just without the blowup. This is a test-environment-
  // only patch — it never touches app code, and matching for every other
  // selector is untouched.
  const origMatches = Element.prototype.matches
  const origWebkitMatches = Element.prototype.webkitMatchesSelector
  const alwaysFalseInJSDOM = new Set([":fullscreen", ":modal", ":picture-in-picture"])
  Element.prototype.matches = function (selector: string) {
    if (alwaysFalseInJSDOM.has(selector)) return false
    return origMatches.call(this, selector)
  }
  if (origWebkitMatches) {
    Element.prototype.webkitMatchesSelector = function (selector: string) {
      if (alwaysFalseInJSDOM.has(selector)) return false
      return origWebkitMatches.call(this, selector)
    }
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
