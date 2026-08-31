import type { IncomingMessage, ServerResponse } from "node:http";
import * as db from "./db";

export function handleApiRequest(req: IncomingMessage, res: ServerResponse): boolean {
  const urlObj = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const pathname = urlObj.pathname;

  if (!pathname.startsWith("/api/")) {
    return false;
  }

  // Set JSON headers
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }

  const sendJson = (statusCode: number, data: any) => {
    res.statusCode = statusCode;
    res.end(JSON.stringify(data));
  };

  const getBody = async (): Promise<any> => {
    return new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  };

  try {
    // Health check
    if (pathname === "/api/health" && req.method === "GET") {
      sendJson(200, { status: "ok", engine: "node:sqlite", time: Date.now() });
      return true;
    }

    // Bootstrap data in a single round-trip
    if (pathname === "/api/bootstrap" && req.method === "GET") {
      const products = db.getProducts();
      const users = db.getUsers();
      const transactions = db.getTransactions();
      sendJson(200, { products, users, transactions });
      return true;
    }

    // Products endpoints
    if (pathname === "/api/products" && req.method === "GET") {
      sendJson(200, db.getProducts());
      return true;
    }

    if (pathname === "/api/products" && req.method === "POST") {
      getBody().then((body) => {
        const saved = db.upsertProduct(body);
        sendJson(200, saved);
      });
      return true;
    }

    if (pathname.startsWith("/api/products/") && pathname.endsWith("/stock") && req.method === "PATCH") {
      const id = pathname.replace("/api/products/", "").replace("/stock", "");
      getBody().then((body) => {
        const ok = db.updateStock(id, body.stock);
        sendJson(200, { success: ok });
      });
      return true;
    }

    if (pathname.startsWith("/api/products/") && pathname.endsWith("/available") && req.method === "PATCH") {
      const id = pathname.replace("/api/products/", "").replace("/available", "");
      const ok = db.toggleAvailable(id);
      sendJson(200, { success: ok });
      return true;
    }

    if (pathname.startsWith("/api/products/") && req.method === "DELETE") {
      const id = pathname.replace("/api/products/", "");
      const ok = db.deleteProduct(id);
      sendJson(200, { success: ok });
      return true;
    }

    // Users endpoints
    if (pathname === "/api/users" && req.method === "GET") {
      sendJson(200, db.getUsers());
      return true;
    }

    if (pathname === "/api/users" && req.method === "POST") {
      getBody().then((body) => {
        const created = db.createUser(body);
        sendJson(201, created);
      });
      return true;
    }

    if (pathname.startsWith("/api/users/") && req.method === "PUT") {
      const id = pathname.replace("/api/users/", "");
      getBody().then((body) => {
        const updated = db.updateUser({ ...body, id });
        sendJson(200, updated);
      });
      return true;
    }

    if (pathname.startsWith("/api/users/") && req.method === "DELETE") {
      const id = pathname.replace("/api/users/", "");
      const ok = db.deleteUser(id);
      sendJson(200, { success: ok });
      return true;
    }

    // Transactions endpoints
    if (pathname === "/api/transactions" && req.method === "GET") {
      sendJson(200, db.getTransactions());
      return true;
    }

    if (pathname === "/api/transactions" && req.method === "POST") {
      getBody().then((body) => {
        const txn = db.createTransaction(body);
        sendJson(201, txn);
      });
      return true;
    }

    if (pathname.startsWith("/api/transactions/") && pathname.endsWith("/refund") && req.method === "POST") {
      const id = pathname.replace("/api/transactions/", "").replace("/refund", "");
      const refunded = db.refundTransaction(id);
      if (refunded) {
        sendJson(200, refunded);
      } else {
        sendJson(404, { error: "Transaction not found" });
      }
      return true;
    }

    sendJson(404, { error: "Route not found" });
    return true;
  } catch (err: any) {
    console.error("API error:", err);
    sendJson(500, { error: err.message || "Internal server error" });
    return true;
  }
}
