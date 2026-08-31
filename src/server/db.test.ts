// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import * as db from "./db";


describe("SQLite Database Layer (pos.db)", () => {
  it("initializes SQLite database and tables with default Sri Lankan catalog and staff", () => {
    const products = db.getProducts();
    const users = db.getUsers();

    expect(products.length).toBeGreaterThan(0);
    expect(users.length).toBeGreaterThan(0);

    // Verify Sri Lankan staff
    const kasun = users.find((u) => u.name === "Kasun Perera");
    expect(kasun).toBeDefined();
    expect(kasun?.role).toBe("manager");
    expect(kasun?.pin).toBe("1234");
  });

  it("inserts and updates products in the database", () => {
    const testProd = {
      id: `p-test-${Date.now()}`,
      sku: "TEST-01",
      name: "Single Origin Nuwara Eliya Tea",
      category: "brew" as const,
      price: 850,
      cost: 150,
      stock: 25,
      available: true,
      popularity: 4,
    };

    db.upsertProduct(testProd);
    let all = db.getProducts();
    let found = all.find((p) => p.id === testProd.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Single Origin Nuwara Eliya Tea");
    expect(found?.stock).toBe(25);

    // Update stock
    db.updateStock(testProd.id, 18);
    all = db.getProducts();
    found = all.find((p) => p.id === testProd.id);
    expect(found?.stock).toBe(18);

    // Delete product
    db.deleteProduct(testProd.id);
    all = db.getProducts();
    expect(all.find((p) => p.id === testProd.id)).toBeUndefined();
  });

  it("executes atomic sales checkout and updates inventory stock", () => {
    const products = db.getProducts();
    const targetProd = products[0];
    db.updateStock(targetProd.id, 20);
    const initialStock = 20;

    const txn = db.createTransaction({

      lines: [
        {
          productId: targetProd.id,
          name: targetProd.name,
          price: targetProd.price,
          qty: 2,
        },
      ],
      subtotal: targetProd.price * 2,
      discount: 0,
      tax: targetProd.price * 2 * 0.085,
      total: targetProd.price * 2 * 1.085,
      method: "card",
      cashierName: "Kasun Perera",
    });

    expect(txn.id).toMatch(/^TX-\d+/);
    expect(txn.status).toBe("completed");

    // Verify product stock was decremented in database
    const updatedProd = db.getProducts().find((p) => p.id === targetProd.id);
    expect(updatedProd?.stock).toBe(Math.max(0, initialStock - 2));

    // Refund transaction and verify stock restoration
    const refunded = db.refundTransaction(txn.id);
    expect(refunded?.status).toBe("refunded");

    const restoredProd = db.getProducts().find((p) => p.id === targetProd.id);
    expect(restoredProd?.stock).toBe(initialStock);
  });
});
