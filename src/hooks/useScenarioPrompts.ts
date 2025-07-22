
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

      // Fetch scenarios from Supabase
      const { data, error } = await supabase
        .from('scenario_prompts')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching scenarios:', error);
        setError('Failed to load scenarios');
        // Fallback to static data
        setScenarios(HEALTHCARE_SCENARIOS);
        return;
      }

      // Map database fields to expected interface
      const mappedScenarios: Scenario[] = data?.map((item: DatabaseScenario) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        prompt: item.prompt_text, // Map prompt_text to prompt
        openingMessage: item.opening_message,
        category: item.category as 'healthcare' | 'customer-service' | 'compliance-hr'
      })) || [];

      setScenarios(mappedScenarios);
      
    } catch (err) {
      console.error('Error in fetchScenarios:', err);
      setError('An unexpected error occurred');
      // Fallback to static data only on unexpected errors
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
