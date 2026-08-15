export type CurrentUser = {
  id: string;
  customerId: string;
  name: string;
  email: string;
  role: "CUSTOMER";
};

const DEMO_CUSTOMER: CurrentUser = {
  id: "demo-client",
  customerId: "demo-client",
  name: "Demo Client",
  email: "client@example.com",
  role: "CUSTOMER",
};

/**
 * Stub identity for the prototype. There is no real authentication —
 * every request is treated as this single demo customer.
 */
export function getCurrentUser(): CurrentUser {
  return DEMO_CUSTOMER;
}
