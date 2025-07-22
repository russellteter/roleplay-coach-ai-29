
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  openingMessage: string;
}

export const useScenarioPrompts = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('scenario_prompts')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Map the data to ensure consistent category naming
        const mappedScenarios = data?.map((scenario: any) => ({
          ...scenario,
          openingMessage: scenario.opening_message || scenario.openingMessage
        })) || [];

        setScenarios(mappedScenarios);
      } catch (err) {
        console.error('Error fetching scenarios:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch scenarios');
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  return { scenarios, loading, error };
};
