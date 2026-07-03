export interface Person {
  id: string;

  firstName: string;
  lastName: string;

  role?: string;
  linkedin?: string;
  email?: string;

  source: string;

  notes?: string;
}