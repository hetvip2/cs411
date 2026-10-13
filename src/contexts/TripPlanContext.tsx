import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface Park {
  park_id: number;
  park_name: string;
  park_code: string;
  state: string;
  description: string;
  added_at: string;
  user_notes: string | null;
  activities?: Array<{
    activity_id: number;
    activity_name: string;
    description?: string;
  }>;
}

interface TripPlan {
  trip_plan_id: number;
  user_id: number;
  plan_name: string;
  created_at: string;
  updated_at: string;
  parks: Park[];
}

interface TripPlanContextType {
  tripPlans: TripPlan[];
  loading: boolean;
  error: string | null;
  fetchTripPlans: () => Promise<void>;
  createTripPlan: (planName: string) => Promise<TripPlan>;
  updateTripPlan: (tripPlanId: number, planName: string) => Promise<void>;
  deleteTripPlan: (tripPlanId: number) => Promise<void>;
  addParkToPlan: (tripPlanId: number, parkId: number, userNotes?: string) => Promise<void>;
  removeParkFromPlan: (tripPlanId: number, parkId: number) => Promise<void>;
  updateParkNotes: (tripPlanId: number, parkId: number, userNotes: string) => Promise<void>;
  fetchTripSummary: (tripId: number) => Promise<string | null>;
}

const TripPlanContext = createContext<TripPlanContextType | undefined>(undefined);

export const TripPlanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tripPlans, setTripPlans] = useState<TripPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = React.useState(false);

  const fetchTripPlans = useCallback(async () => {
    if (!user) {
      console.log('No user available for fetching trip plans');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const url = `http://localhost:3001/api/trip-plans/user/${user.user_id}`;
      console.log('Fetching trip plans from:', url);
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch trip plans');
      }
      const data = await response.json();
      console.log('Trip plans data received:', data);
      setTripPlans(data.trip_plans || []);
    } catch (err) {
      console.error('Error fetching trip plans:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch trip plans');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createTripPlan = useCallback(async (planName: string): Promise<TripPlan> => {
    if (!user) throw new Error('User not logged in');

    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/trip-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, plan_name: planName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create trip plan');
      }

      const data = await response.json();
      const newPlan = data.trip_plan;
      setTripPlans(prev => [newPlan, ...prev]);
      return newPlan;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create trip plan';
      setError(errorMsg);
      throw err;
    }
  }, [user]);

  const updateTripPlan = useCallback(async (tripPlanId: number, planName: string): Promise<void> => {
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/trip-plans/${tripPlanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_name: planName })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update trip plan');
      }

      setTripPlans(prev =>
        prev.map(plan =>
          plan.trip_plan_id === tripPlanId
            ? { ...plan, plan_name: planName }
            : plan
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update trip plan';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const deleteTripPlan = useCallback(async (tripPlanId: number): Promise<void> => {
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/trip-plans/${tripPlanId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete trip plan');
      }

      setTripPlans(prev => prev.filter(plan => plan.trip_plan_id !== tripPlanId));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete trip plan';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const addParkToPlan = useCallback(async (tripPlanId: number, parkId: number, userNotes?: string): Promise<void> => {
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/trip-plans/${tripPlanId}/parks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ park_id: parkId, user_notes: userNotes || null })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add park to trip plan');
      }

      // Refresh the specific trip plan to get updated parks list
      const tripPlanResponse = await fetch(`http://localhost:3001/api/trip-plans/${tripPlanId}`);
      if (tripPlanResponse.ok) {
        const tripPlanData = await tripPlanResponse.json();
        setTripPlans(prev =>
          prev.map(plan =>
            plan.trip_plan_id === tripPlanId ? tripPlanData.trip_plan : plan
          )
        );
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add park to trip plan';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const removeParkFromPlan = useCallback(async (tripPlanId: number, parkId: number): Promise<void> => {
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/trip-plans/${tripPlanId}/parks/${parkId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove park from trip plan');
      }

      setTripPlans(prev =>
        prev.map(plan =>
          plan.trip_plan_id === tripPlanId
            ? { ...plan, parks: plan.parks.filter(p => p.park_id !== parkId) }
            : plan
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to remove park from trip plan';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const updateParkNotes = useCallback(async (tripPlanId: number, parkId: number, userNotes: string): Promise<void> => {
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/trip-plans/${tripPlanId}/parks/${parkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_notes: userNotes })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update park notes');
      }

      setTripPlans(prev =>
        prev.map(plan =>
          plan.trip_plan_id === tripPlanId
            ? {
                ...plan,
                parks: plan.parks.map(p =>
                  p.park_id === parkId ? { ...p, user_notes: userNotes } : p
                )
              }
            : plan
        )
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update park notes';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const fetchTripSummary = useCallback(async (tripId: number): Promise<string | null> => {
    try {
      const response = await fetch(`http://localhost:3001/api/trip-plans/${tripId}/summary`);
      
      if (!response.ok) {
        console.error('Failed to fetch trip summary:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.summary) {
        return data.summary;
      }
      
      return null;
    } catch (err) {
      console.error('Error fetching trip summary:', err);
      return null;
    }
  }, []);

  // Auto-fetch trip plans when user becomes available
  React.useEffect(() => {
    if (user && !hasInitialized) {
      console.log('User available, fetching trip plans');
      fetchTripPlans();
      setHasInitialized(true);
    }
  }, [user, hasInitialized, fetchTripPlans]);

  return (
    <TripPlanContext.Provider
      value={{
        tripPlans,
        loading,
        error,
        fetchTripPlans,
        createTripPlan,
        updateTripPlan,
        deleteTripPlan,
        addParkToPlan,
        removeParkFromPlan,
        updateParkNotes,
        fetchTripSummary
      }}
    >
      {children}
    </TripPlanContext.Provider>
  );
};

export const useTripPlan = () => {
  const context = useContext(TripPlanContext);
  if (context === undefined) {
    throw new Error('useTripPlan must be used within a TripPlanProvider');
  }
  return context;
};
