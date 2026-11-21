import { expect, test } from "bun:test";
import { canRecoverAdmin } from "./policy";

test("recovery changes only the authenticated admin account", () => {
  expect(canRecoverAdmin("admin-a", "admin-a", "admin")).toBe(true);
  expect(canRecoverAdmin("admin-b", "admin-a", "admin")).toBe(false);
  expect(canRecoverAdmin("admin-a", "admin-a", "parent")).toBe(false);
  expect(canRecoverAdmin("admin-a", "admin-a", undefined)).toBe(false);
});