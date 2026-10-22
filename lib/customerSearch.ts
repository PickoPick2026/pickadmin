type SearchableCustomer = {
  firstName?: unknown
  lastName?: unknown
  phoneNumber?: unknown
  emailID?: unknown
}

/** Website and legacy accounts may have missing names or contact fields. */
export function filterCustomers<T extends SearchableCustomer>(customers: readonly T[], search: string): T[] {
  const query = search.trim().toLowerCase()
  if (!query) return [...customers]

  return customers.filter((customer) => {
    const firstName = String(customer.firstName ?? "")
    const lastName = String(customer.lastName ?? "")
    return [firstName, lastName, `${firstName} ${lastName}`.trim(), customer.phoneNumber, customer.emailID]
      .some((value) => String(value ?? "").toLowerCase().includes(query))
  })
}
