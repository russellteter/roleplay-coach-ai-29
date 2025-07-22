
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Scenario } from '@/utils/scenarioPrompts';

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

      const { data, error: supabaseError } = await supabase
        .from('scenario_prompts')
        .select('*')
        .order('created_at', { ascending: true });

      if (supabaseError) {
        console.error('Error fetching scenarios:', supabaseError);
        setError('Failed to load scenarios from database');
        return;
      }

      if (data) {
        const formattedScenarios: Scenario[] = data.map((item: DatabaseScenario) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          prompt: item.prompt_text,
          openingMessage: item.opening_message,
          category: item.category as 'healthcare' | 'customer-service' | 'leadership' | 'general'
        }));
        
        setScenarios(formattedScenarios);
      }
    } catch (err) {
      console.error('Error in fetchScenarios:', err);
      setError('An unexpected error occurred');
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
