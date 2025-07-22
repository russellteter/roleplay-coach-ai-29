
export interface Scenario {
  id: string;
  title: string;
  description: string;
  prompt: string;
  openingMessage: string;
  category: string; // Changed from union type to string to match database
}

// Legacy scenarios kept as fallback only - database is now primary source
export const HEALTHCARE_SCENARIOS: Scenario[] = [];
