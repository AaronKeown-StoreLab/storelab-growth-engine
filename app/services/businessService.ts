import {
  addNotebookEntryToBusiness,
  getBusinesses,
} from "../repositories/businessRepository";

export async function loadBusinesses() {
  return getBusinesses();
}

export async function createNotebookEntry(businessId: string, content: string) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Note cannot be empty.");
  }

  return addNotebookEntryToBusiness(businessId, trimmedContent);
}