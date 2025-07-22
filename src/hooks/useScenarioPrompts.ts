
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Scenario, HEALTHCARE_SCENARIOS } from '@/utils/scenarioPrompts';

export interface DatabaseScenario {
  id: string;
  title: string;
  description: string;
  prompt_text: string;
  opening_message: string;
  category: string;
  created_at: string;
}

export const useScenarioPrompts = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use static data for now since Supabase table doesn't exist yet
      setScenarios(HEALTHCARE_SCENARIOS);
      
    } catch (err) {
      console.error('Error in fetchScenarios:', err);
      setError('An unexpected error occurred');
      setScenarios(HEALTHCARE_SCENARIOS);
    } finally {
      setLoading(false);
    }
  };

  const getScenarioById = (id: string): Scenario | undefined => {
    return scenarios.find(scenario => scenario.id === id);
  };

  return {
    scenarios,
    loading,
    error,
    refetch: fetchScenarios,
    getScenarioById
  };
};
