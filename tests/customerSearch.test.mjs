import assert from "node:assert/strict"
import { test } from "node:test"
import { filterCustomers } from "../lib/customerSearch.ts"

const customers = [
  { customerID: 1, firstName: "Mugesh", lastName: null, phoneNumber: "", emailID: "mugesh@example.test" },
  { customerID: 2, firstName: null, lastName: "Rao", phoneNumber: null, emailID: null },
  { customerID: 3, firstName: "Shiva", lastName: "Kumar", phoneNumber: "+44 7700 900123", emailID: "shiva@example.test" },
  { customerID: 4 },
  { customerID: 5, firstName: "Legacy", lastName: "", phoneNumber: 9001234567, emailID: "legacy@example.test" },
]

test("search skips null surnames and contact fields without crashing", () => {
  assert.deepEqual(filterCustomers(customers, "rao"), [customers[1]])
  assert.deepEqual(filterCustomers(customers, "not-a-customer"), [])
})

test("names and email match without case sensitivity, including full names", () => {
  assert.deepEqual(filterCustomers(customers, "MUGESH"), [customers[0]])
  assert.deepEqual(filterCustomers(customers, "shiva kumar"), [customers[2]])
  assert.deepEqual(filterCustomers(customers, "LEGACY@EXAMPLE.TEST"), [customers[4]])
})

test("phone search supports international strings and older numeric values", () => {
  assert.deepEqual(filterCustomers(customers, "+44"), [customers[2]])
  assert.deepEqual(filterCustomers(customers, "9001234567"), [customers[4]])
})

test("clearing search restores every customer, including incomplete accounts", () => {
  assert.deepEqual(filterCustomers(customers, ""), customers)
  assert.deepEqual(filterCustomers(customers, "   "), customers)
  assert.deepEqual(filterCustomers(customers, "  RAO  "), [customers[1]])
})

test("empty lists stay empty and filtering does not alter customer records", () => {
  assert.deepEqual(filterCustomers([], "anything"), [])
  const copy = structuredClone(customers)
  filterCustomers(customers, "shiva")
  assert.deepEqual(customers, copy)
})
