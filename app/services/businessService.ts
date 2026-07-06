import { getBusinesses } from "../repositories/businessRepository";

export async function loadBusinesses() {
  return getBusinesses();
}