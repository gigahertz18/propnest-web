/**
 * Tests for the ReceiptHistory component.
 *
 * Covers: loading, empty state with first-issue action, listing existing
 * receipts newest-first, opening receipt detail, downloading via a
 * fetch-based blob flow with visible error handling on failure, reprinting
 * without losing the original record, and a failed initial fetch with
 * retry.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { ReceiptHistory } from "@/components/ui/ReceiptHistory"
import { receiptsApi } from "@/lib/api/receipts"
import { ApiError } from "@/types"
import type { Receipt } from "@/types/receipt"
import type { Payment } from "@/types/payment"

jest.mock("@/lib/api/receipts", () => ({
  receiptsApi: {
    listForPayment: jest.fn(),
    issue: jest.fn(),
    download: jest.fn(),
    downloadUrl: jest.fn((id: string) => `/api/receipts/${id}/download`),
  },
}))

const mockListForPayment = receiptsApi.listForPayment as jest.MockedFunction<
  typeof receiptsApi.listForPayment
>
const mockIssue = receiptsApi.issue as jest.MockedFunction<typeof receiptsApi.issue>
const mockDownload = receiptsApi.download as jest.MockedFunction<typeof receiptsApi.download>

const mockPayment: Payment = {
  id: "payment-uuid-1",
  contract_id: "contract-uuid-1",
  billing_record_id: "billing-uuid-1",
  amount: "15000.00",
  paid_at: "2026-01-05T00:00:00Z",
  payment_method: "gcash",
  status: "PAID",
  reference_number: "REF-001",
  corrects_payment_id: null,
  created_at: "2026-01-05T00:00:00Z",
  updated_at: "2026-01-05T00:00:00Z",
}

const receiptOne: Receipt = {
  id: "receipt-uuid-1",
  receipt_number: 1,
  payment_id: "payment-uuid-1",
  document_id: "document-uuid-1",
  created_at: "2026-01-05T00:05:00Z",
  updated_at: "2026-01-05T00:05:00Z",
}

const receiptTwo: Receipt = {
  ...receiptOne,
  id: "receipt-uuid-2",
  receipt_number: 2,
  created_at: "2026-01-06T00:05:00Z",
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("ReceiptHistory", () => {
  it("shows an empty state with an Issue receipt action when there are none yet", async () => {
    mockListForPayment.mockResolvedValue([])
    render(
      <ReceiptHistory
        payment={mockPayment}
        contractLabel="Sunset Villa — Jane Doe"
        onError={jest.fn()}
      />
    )

    expect(await screen.findByText(/no receipts issued yet/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /issue receipt/i })).toBeInTheDocument()
  })

  it("lists existing receipts newest-first", async () => {
    mockListForPayment.mockResolvedValue([receiptOne, receiptTwo])
    render(
      <ReceiptHistory
        payment={mockPayment}
        contractLabel="Sunset Villa — Jane Doe"
        onError={jest.fn()}
      />
    )

    const items = await screen.findAllByText(/^Receipt #/)
    expect(items[0]).toHaveTextContent("Receipt #2")
    expect(items[1]).toHaveTextContent("Receipt #1")
  })

  it("issuing the first receipt calls receiptsApi.issue and adds it to the list", async () => {
    mockListForPayment.mockResolvedValue([])
    mockIssue.mockResolvedValue(receiptOne)
    render(
      <ReceiptHistory
        payment={mockPayment}
        contractLabel="Sunset Villa — Jane Doe"
        onError={jest.fn()}
      />
    )

    fireEvent.click(await screen.findByRole("button", { name: /issue receipt/i }))

    await waitFor(() => expect(mockIssue).toHaveBeenCalledWith("payment-uuid-1"))
    expect(await screen.findByText("Receipt #1")).toBeInTheDocument()
  })

  it("opening a receipt shows its detail with a download action and a reprint action", async () => {
    mockListForPayment.mockResolvedValue([receiptOne])
    render(
      <ReceiptHistory
        payment={mockPayment}
        contractLabel="Sunset Villa — Jane Doe"
        onError={jest.fn()}
      />
    )

    fireEvent.click(await screen.findByText("Receipt #1"))

    expect(screen.getByRole("button", { name: /download pdf/i })).toBeEnabled()
    expect(screen.getByRole("button", { name: /reprint receipt/i })).toBeInTheDocument()
  })

  it("shows the paid date without a fabricated time-of-day, while the issued line keeps its full timestamp", async () => {
    mockListForPayment.mockResolvedValue([receiptOne])
    render(
      <ReceiptHistory
        payment={mockPayment}
        contractLabel="Sunset Villa — Jane Doe"
        onError={jest.fn()}
      />
    )

    fireEvent.click(await screen.findByText("Receipt #1"))

    const paidOn = await screen.findByText(/^Paid on/)
    expect(paidOn).toHaveTextContent("Paid on Jan 5, 2026")
    expect(paidOn.textContent).not.toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i)

    const issued = screen.getByText(/^Issued/)
    expect(issued.textContent).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/i)
  })

  describe("downloading a receipt", () => {
    let createObjectURLSpy: jest.SpyInstance
    let revokeObjectURLSpy: jest.SpyInstance
    let clickSpy: jest.SpyInstance

    beforeEach(() => {
      createObjectURLSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url")
      revokeObjectURLSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => {})
      clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {})
    })

    afterEach(() => {
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
      clickSpy.mockRestore()
    })

    it("fetches the file and triggers a blob download on success", async () => {
      mockListForPayment.mockResolvedValue([receiptOne])
      const blob = new Blob(["pdf-bytes"])
      mockDownload.mockResolvedValue({ blob, filename: "receipt-1.pdf" })
      render(
        <ReceiptHistory
          payment={mockPayment}
          contractLabel="Sunset Villa — Jane Doe"
          onError={jest.fn()}
        />
      )

      fireEvent.click(await screen.findByText("Receipt #1"))
      fireEvent.click(screen.getByRole("button", { name: /download pdf/i }))

      await waitFor(() => expect(mockDownload).toHaveBeenCalledWith("receipt-uuid-1", 1))
      await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalledWith(blob))
      expect(clickSpy).toHaveBeenCalled()
      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url")
    })

    it("shows a visible error via onError and does not trigger a download when the fetch fails", async () => {
      mockListForPayment.mockResolvedValue([receiptOne])
      mockDownload.mockRejectedValue(new ApiError(403, "Not authorized for this property"))
      const onError = jest.fn()
      render(
        <ReceiptHistory
          payment={mockPayment}
          contractLabel="Sunset Villa — Jane Doe"
          onError={onError}
        />
      )

      fireEvent.click(await screen.findByText("Receipt #1"))
      fireEvent.click(screen.getByRole("button", { name: /download pdf/i }))

      await waitFor(() => expect(onError).toHaveBeenCalledWith("Not authorized for this property"))
      expect(createObjectURLSpy).not.toHaveBeenCalled()
    })
  })

  it("reprinting issues a new receipt without removing the original from history", async () => {
    mockListForPayment.mockResolvedValue([receiptOne])
    mockIssue.mockResolvedValue(receiptTwo)
    render(
      <ReceiptHistory
        payment={mockPayment}
        contractLabel="Sunset Villa — Jane Doe"
        onError={jest.fn()}
      />
    )

    fireEvent.click(await screen.findByText("Receipt #1"))
    fireEvent.click(screen.getByRole("button", { name: /reprint receipt/i }))

    await waitFor(() => expect(mockIssue).toHaveBeenCalledWith("payment-uuid-1"))

    // Back to the list — both the original and the reprint must be present.
    fireEvent.click(screen.getByRole("button", { name: /back to receipt history/i }))
    expect(await screen.findByText("Receipt #1")).toBeInTheDocument()
    expect(screen.getByText("Receipt #2")).toBeInTheDocument()
  })

  it("shows a retryable error when the initial fetch fails", async () => {
    mockListForPayment.mockRejectedValueOnce(new Error("network down"))
    mockListForPayment.mockResolvedValueOnce([receiptOne])
    render(
      <ReceiptHistory
        payment={mockPayment}
        contractLabel="Sunset Villa — Jane Doe"
        onError={jest.fn()}
      />
    )

    expect(await screen.findByText(/failed to load receipts/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /retry/i }))

    expect(await screen.findByText("Receipt #1")).toBeInTheDocument()
  })
})
