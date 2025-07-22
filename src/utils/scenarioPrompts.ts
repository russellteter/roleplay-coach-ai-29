
export interface Scenario {
  id: string;
  title: string;
  description: string;
  prompt: string;
  openingMessage: string;
  category: 'healthcare' | 'customer-service' | 'compliance-hr';
}

// Legacy scenarios kept as fallback only - database is now primary source
export const HEALTHCARE_SCENARIOS: Scenario[] = [];
