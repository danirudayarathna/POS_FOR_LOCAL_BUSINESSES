import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "./App";

describe("Client-Side Navigation and Keyboard Shortcuts Flow", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("navigates seamlessly between views via UI buttons", async () => {
    render(<App />);

    // Initial state: Register view loads with Sri Lankan LKR prices & cashier
    expect(screen.getByPlaceholderText(/search the menu/i)).toBeDefined();
    expect(screen.getByText(/Kasun Perera/i)).toBeDefined();

    // 1. Navigate to Dashboard
    const dashboardBtn = screen.getByRole("button", { name: /dashboard/i });
    fireEvent.click(dashboardBtn);
    expect(screen.getByText(/store performance at a glance/i)).toBeDefined();

    // 2. Select different date range filters on Dashboard
    const todayFilter = screen.getByRole("button", { name: /^today$/i });
    fireEvent.click(todayFilter);

    const thirtyDaysFilter = screen.getByRole("button", { name: /30 days/i });
    fireEvent.click(thirtyDaysFilter);

    // 3. Navigate to Products
    const productsBtn = screen.getByRole("button", { name: /products/i });
    fireEvent.click(productsBtn);
    expect(screen.getByPlaceholderText(/search name or sku/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /add product/i })).toBeDefined();

    // 4. Navigate to Staff
    const staffBtn = screen.getByRole("button", { name: /staff/i });
    fireEvent.click(staffBtn);
    expect(screen.getByPlaceholderText(/search staff name or email/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /add staff/i })).toBeDefined();

    // 5. Navigate to Transactions
    const transactionsBtn = screen.getByRole("button", { name: /transactions/i });
    fireEvent.click(transactionsBtn);
    expect(screen.getByPlaceholderText(/search order # or item/i)).toBeDefined();
  });

  it("supports global keyboard shortcuts for view switching (Alt+1..5)", async () => {
    render(<App />);

    // Alt+2 -> Dashboard view
    fireEvent.keyDown(window, { key: "2", altKey: true });
    expect(screen.getByText(/store performance at a glance/i)).toBeDefined();

    // Alt+4 -> Products view
    fireEvent.keyDown(window, { key: "4", altKey: true });
    expect(screen.getByPlaceholderText(/search name or sku/i)).toBeDefined();

    // Alt+5 -> Staff Management view
    fireEvent.keyDown(window, { key: "5", altKey: true });
    expect(screen.getByPlaceholderText(/search staff name or email/i)).toBeDefined();

    // Alt+3 -> Transactions view
    fireEvent.keyDown(window, { key: "3", altKey: true });
    expect(screen.getByPlaceholderText(/search order # or item/i)).toBeDefined();

    // Alt+1 -> Register view
    fireEvent.keyDown(window, { key: "1", altKey: true });
    expect(screen.getByPlaceholderText(/search the menu/i)).toBeDefined();
  });

  it("opens and closes keyboard shortcuts modal using ? and Escape", async () => {
    render(<App />);

    // Press ? to open cheatsheet
    fireEvent.keyDown(window, { key: "?" });
    expect(screen.getByText(/Keyboard Shortcuts/i)).toBeDefined();
    expect(screen.getByText(/Proceed to Charge & Payment/i)).toBeDefined();

    // Press Escape to close modal
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByText(/Proceed to Charge & Payment/i)).toBeNull();
    });
  });

  it("supports terminal lock with Ctrl+L and unlocking with staff PIN", async () => {
    render(<App />);

    // Lock terminal with Ctrl+L
    fireEvent.keyDown(window, { key: "l", ctrlKey: true });
    expect(screen.getByText(/Enter PIN to resume shift/i)).toBeDefined();
    expect(screen.getAllByText(/Dilshan/i).length).toBeGreaterThan(0);

    // Unlock with Kasun's PIN (1234)
    fireEvent.click(screen.getByText("1"));
    fireEvent.click(screen.getByText("2"));
    fireEvent.click(screen.getByText("3"));
    fireEvent.click(screen.getByText("4"));

    // Back to Register
    await waitFor(() => {
      expect(screen.queryByText(/Enter PIN to resume shift/i)).toBeNull();
    });
    expect(screen.getByPlaceholderText(/search the menu/i)).toBeDefined();
  });

  it("navigates products on Register with Arrow keys and adds item with Enter", async () => {
    render(<App />);

    // Initially cart is empty
    expect(screen.getByText(/No items yet/i)).toBeDefined();

    // Navigate right, down, up, and press Enter to add highlighted item to cart
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    fireEvent.keyDown(window, { key: "ArrowUp" });
    fireEvent.keyDown(window, { key: "Enter" });

    // Item was added to cart
    expect(screen.queryByText(/No items yet/i)).toBeNull();
    expect(screen.getByText(/Subtotal/i)).toBeDefined();
  });
});
