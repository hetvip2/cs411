import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MapPin, Edit3, Trash2, Plus, Loader2, Search, X, Sparkles } from "lucide-react";
import Navigation from "@/components/Navigation";
import { useTripPlan } from "@/contexts/TripPlanContext";
import { cleanParkName } from "@/lib/utils";

interface Park {
  park_id: number;
  park_name: string;
  state: string;
  description?: string;
  activities?: Array<{
    activity_id: number;
    activity_name: string;
    description?: string;
  }>;
}

interface ParkWithNotes extends Park {
  user_notes: string;
}

const Profile = () => {
  const { tripPlans, loading, error, fetchTripPlans, createTripPlan, updateTripPlan, deleteTripPlan, removeParkFromPlan, updateParkNotes, addParkToPlan, fetchTripSummary } = useTripPlan();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [creating, setCreating] = useState(false);
  const [creationStep, setCreationStep] = useState<'name' | 'parks'>('name');
  
  // Trip summary state
  const [tripSummaries, setTripSummaries] = useState<{ [key: number]: string | null }>({});
  const [loadingSummary, setLoadingSummary] = useState<{ [key: number]: boolean }>({});
  
  // Park selection state
  const [availableParks, setAvailableParks] = useState<Park[]>([]);
  const [parkSearchQuery, setParkSearchQuery] = useState("");
  const [selectedParks, setSelectedParks] = useState<ParkWithNotes[]>([]);
  const [loadingParks, setLoadingParks] = useState(false);
  const [parkNoteInput, setParkNoteInput] = useState("");
  const [selectedParkForNote, setSelectedParkForNote] = useState<Park | null>(null);
  
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [editingPlanName, setEditingPlanName] = useState("");
  
  const [editingNotes, setEditingNotes] = useState<{ tripPlanId: number; parkId: number } | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [updatingNotes, setUpdatingNotes] = useState(false);
  
  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);
  const [deletingParkId, setDeletingParkId] = useState<{ tripPlanId: number; parkId: number } | null>(null);

  // Edit plan state (for adding parks to existing plans)
  const [editingPlanParks, setEditingPlanParks] = useState<number | null>(null);
  const [editPlanAvailableParks, setEditPlanAvailableParks] = useState<Park[]>([]);
  const [editPlanSearchQuery, setEditPlanSearchQuery] = useState("");
  const [editPlanLoadingParks, setEditPlanLoadingParks] = useState(false);
  const [editPlanSelectedParkForNote, setEditPlanSelectedParkForNote] = useState<Park | null>(null);
  const [editPlanParkNoteInput, setEditPlanParkNoteInput] = useState("");

  const fetchAvailableParks = async () => {
    setLoadingParks(true);
    try {
      const query = parkSearchQuery ? `?q=${encodeURIComponent(parkSearchQuery)}` : '';
      const response = await fetch(`http://localhost:3001/api/search${query}`);
      if (!response.ok) throw new Error('Failed to fetch parks');
      const parks = await response.json();
      setAvailableParks(parks);
    } catch (err) {
      console.error('Error fetching parks:', err);
      setAvailableParks([]);
    } finally {
      setLoadingParks(false);
    }
  };

  const loadTripSummary = async (tripId: number) => {
    setLoadingSummary(prev => ({ ...prev, [tripId]: true }));
    try {
      const summary = await fetchTripSummary(tripId);
      setTripSummaries(prev => ({ ...prev, [tripId]: summary }));
    } catch (err) {
      console.error(`Error loading summary for trip ${tripId}:`, err);
      setTripSummaries(prev => ({ ...prev, [tripId]: null }));
    } finally {
      setLoadingSummary(prev => ({ ...prev, [tripId]: false }));
    }
  };

  const handleAddParkToSelection = (park: Park) => {
    setSelectedParkForNote(park);
    setParkNoteInput("");
  };

  const handleConfirmParkWithNotes = () => {
    if (!selectedParkForNote) return;
    
    const isParkAlreadySelected = selectedParks.some(p => p.park_id === selectedParkForNote.park_id);
    if (isParkAlreadySelected) {
      alert("This park is already in your trip plan");
      return;
    }

    setSelectedParks([...selectedParks, {
      ...selectedParkForNote,
      user_notes: parkNoteInput
    }]);
    setSelectedParkForNote(null);
    setParkNoteInput("");
  };

  const handleRemoveSelectedPark = (parkId: number) => {
    setSelectedParks(selectedParks.filter(p => p.park_id !== parkId));
  };

  const handleCreatePlanWithParks = async () => {
    if (!newPlanName.trim()) {
      alert("Please enter a trip plan name");
      return;
    }

    setCreating(true);
    try {
      
      const newPlan = await createTripPlan(newPlanName);
      

      for (const park of selectedParks) {
        await addParkToPlan(newPlan.trip_plan_id, park.park_id, park.user_notes);
      }

    
      setNewPlanName("");
      setSelectedParks([]);
      setCreationStep('name');
      setShowCreateDialog(false);
      
  
      setTimeout(() => {
        loadTripSummary(newPlan.trip_plan_id);
      }, 500);
    } catch (err) {
      console.error('Error creating trip plan:', err);
      alert("Failed to create trip plan. Please try again.");
    } finally {
      setCreating(false);
    }
  };

 
  useEffect(() => {
    if (showCreateDialog && creationStep === 'parks') {
      fetchAvailableParks();
    }
  }, [showCreateDialog, creationStep, parkSearchQuery]);


  useEffect(() => {
    if (editingPlanParks && editingPlanParks > 0) {
      fetchEditPlanAvailableParks();
    }
  }, [editingPlanParks, editPlanSearchQuery]);

  useEffect(() => {

    const loadTripPlans = async () => {
      try {
        await fetchTripPlans();
      } catch (err) {
        console.error('Failed to load trip plans:', err);
      }
    };
    
    loadTripPlans();
  }, [fetchTripPlans]);


  useEffect(() => {
    tripPlans.forEach(plan => {
      if (!tripSummaries.hasOwnProperty(plan.trip_plan_id)) {
        loadTripSummary(plan.trip_plan_id);
      }
    });
  }, [tripPlans]);

  const handleUpdatePlanName = async (tripPlanId: number) => {
    if (!editingPlanName.trim()) return;
    
    try {
      await updateTripPlan(tripPlanId, editingPlanName);
      setEditingPlanId(null);
      setEditingPlanName("");
    } catch (err) {
      console.error('Error updating trip plan:', err);
    }
  };

  const handleEditNotes = (tripPlanId: number, parkId: number, currentNotes: string | null) => {
    setEditingNotes({ tripPlanId, parkId });
    setTempNotes(currentNotes || "");
  };

  const handleSaveNotes = async () => {
    if (!editingNotes) return;
    
    setUpdatingNotes(true);
    try {
      await updateParkNotes(editingNotes.tripPlanId, editingNotes.parkId, tempNotes);
      setEditingNotes(null);
      setTempNotes("");
    } catch (err) {
      console.error('Error updating notes:', err);
    } finally {
      setUpdatingNotes(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingNotes(null);
    setTempNotes("");
  };

  const fetchEditPlanAvailableParks = async () => {
    setEditPlanLoadingParks(true);
    try {
      const query = editPlanSearchQuery ? `?q=${encodeURIComponent(editPlanSearchQuery)}` : '';
      const response = await fetch(`http://localhost:3001/api/search${query}`);
      if (!response.ok) throw new Error('Failed to fetch parks');
      const parks = await response.json();
      setEditPlanAvailableParks(parks);
    } catch (err) {
      console.error('Error fetching parks:', err);
      setEditPlanAvailableParks([]);
    } finally {
      setEditPlanLoadingParks(false);
    }
  };

  const handleAddParkToExistingPlan = (park: Park) => {
    setEditPlanSelectedParkForNote(park);
    setEditPlanParkNoteInput("");
  };

  const handleConfirmAddParkToExistingPlan = async () => {
    if (!editingPlanParks || !editPlanSelectedParkForNote) return;

    try {
      await addParkToPlan(editingPlanParks, editPlanSelectedParkForNote.park_id, editPlanParkNoteInput);
      
    
      setTripSummaries(prev => {
        const updated = { ...prev };
        delete updated[editingPlanParks];
        return updated;
      });
      
      setEditPlanSelectedParkForNote(null);
      setEditPlanParkNoteInput("");
      setEditPlanSearchQuery("");
      

      setTimeout(() => {
        loadTripSummary(editingPlanParks);
      }, 500);
    } catch (err) {
      console.error('Error adding park to plan:', err);
      alert("Failed to add park. It may already be in this plan.");
    }
  };

  const handleRemovePark = async (tripPlanId: number, parkId: number) => {
    try {
      await removeParkFromPlan(tripPlanId, parkId);
      

      setTripSummaries(prev => {
        const updated = { ...prev };
        delete updated[tripPlanId];
        return updated;
      });
      
      setDeletingParkId(null);
      

      setTimeout(() => {
        loadTripSummary(tripPlanId);
      }, 500);
    } catch (err) {
      console.error('Error removing park:', err);
    }
  };

  const handleDeletePlan = async (tripPlanId: number) => {
    try {
      await deleteTripPlan(tripPlanId);
      setDeletingPlanId(null);
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header */}
      <section className="bg-gradient-hero py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              My Trip Plans
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Create and organize multiple trip plans. Add parks, take notes, and plan your perfect adventures.
            </p>
          </div>
        </div>
      </section>

      {}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <Card className="text-center p-12">
              <CardContent>
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground mt-4">Loading trip plans...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="text-center p-12 border-destructive">
              <CardContent>
                <p className="text-destructive">{error}</p>
                <Button onClick={fetchTripPlans} className="mt-4">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : tripPlans.length === 0 ? (
            <Card className="text-center p-12">
              <CardContent>
                <div className="max-w-md mx-auto">
                  <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Trip Plans Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start planning your adventures by creating your first trip plan.
                  </p>
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-forest hover:bg-primary-hover"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Trip Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">
                  Your Trip Plans ({tripPlans.length})
                </h2>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-forest hover:bg-primary-hover"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Trip Plan
                </Button>
              </div>

              {tripPlans.map((plan) => (
                <Card key={plan.trip_plan_id} className="shadow-card">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {editingPlanId === plan.trip_plan_id ? (
                          <div className="flex gap-2">
                            <Input
                              value={editingPlanName}
                              onChange={(e) => setEditingPlanName(e.target.value)}
                              placeholder="Plan name"
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdatePlanName(plan.trip_plan_id)}
                              className="bg-forest hover:bg-primary-hover"
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingPlanId(null);
                                setEditingPlanName("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <CardTitle className="text-2xl">{plan.plan_name}</CardTitle>
                            <Badge variant="secondary">
                              {plan.parks.length} park{plan.parks.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          Created {new Date(plan.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {editingPlanId !== plan.trip_plan_id && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPlanId(plan.trip_plan_id);
                                setEditingPlanName(plan.plan_name);
                              }}
                            >
                              <Edit3 className="h-4 w-4 mr-1" />
                              Rename
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingPlanParks(plan.trip_plan_id);
                                setEditPlanSearchQuery("");
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Parks
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDeletingPlanId(plan.trip_plan_id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {plan.parks.length === 0 ? (
                    <CardContent className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No parks added to this trip plan yet.</p>
                      <Link to="/">
                        <Button variant="outline">
                          <MapPin className="h-4 w-4 mr-2" />
                          Discover Parks
                        </Button>
                      </Link>
                    </CardContent>
                  ) : (
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {plan.parks.map((park) => (
                          <div key={park.park_id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg text-foreground">
                                  {cleanParkName(park.park_name)}
                                </h4>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  <Badge variant="secondary">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {park.state}
                                  </Badge>
                                  <Badge variant="outline">
                                    Added {new Date(park.added_at).toLocaleDateString()}
                                  </Badge>
                                </div>
                                
                                {/* Activities Section */}
                                {park.activities && Array.isArray(park.activities) && park.activities.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {park.activities.slice(0, 4).map((activity) => (
                                      <Badge 
                                        key={activity.activity_id} 
                                        variant="outline" 
                                        className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                      >
                                        {activity.activity_name}
                                      </Badge>
                                    ))}
                                    {park.activities.length > 4 && (
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                      >
                                        +{park.activities.length - 4}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingParkId({ tripPlanId: plan.trip_plan_id, parkId: park.park_id })}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {}
                            <div className="border-t pt-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-sm font-medium text-foreground">
                                  Trip Notes
                                </h5>
                                {editingNotes?.tripPlanId !== plan.trip_plan_id || editingNotes?.parkId !== park.park_id ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditNotes(plan.trip_plan_id, park.park_id, park.user_notes)}
                                  >
                                    <Edit3 className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                ) : null}
                              </div>

                              {editingNotes?.tripPlanId === plan.trip_plan_id && editingNotes?.parkId === park.park_id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={tempNotes}
                                    onChange={(e) => setTempNotes(e.target.value)}
                                    placeholder="Add notes about this park..."
                                    className="min-h-[80px]"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={handleSaveNotes}
                                      disabled={updatingNotes}
                                      className="bg-forest hover:bg-primary-hover"
                                    >
                                      {updatingNotes ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Notes'}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={handleCancelEdit}
                                      disabled={updatingNotes}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                  {park.user_notes || "No notes added yet. Click edit to add notes."}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {}
                      {plan.parks.length > 0 && (
                        <div className="mt-6 border-t pt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            <h4 className="font-semibold text-foreground">Trip Summary</h4>
                          </div>

                          {loadingSummary[plan.trip_plan_id] ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                              <span className="text-sm text-muted-foreground">Generating summary...</span>
                            </div>
                          ) : tripSummaries[plan.trip_plan_id] ? (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                              <p className="text-sm text-amber-900">
                                {tripSummaries[plan.trip_plan_id]?.replace(/^Snapshot:\s*/, '')}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <p className="text-sm text-gray-600">
                                Add parks to this trip to see a summary.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        setShowCreateDialog(open);
        if (!open) {
          setCreationStep('name');
          setNewPlanName("");
          setSelectedParks([]);
          setParkSearchQuery("");
          setSelectedParkForNote(null);
          setParkNoteInput("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {creationStep === 'name' ? 'Create New Trip Plan' : 'Add Parks to Trip Plan'}
            </DialogTitle>
            <DialogDescription>
              {creationStep === 'name' 
                ? 'Give your trip plan a name to get started.'
                : 'Search for parks and add them to your trip plan with custom notes.'}
            </DialogDescription>
          </DialogHeader>

          {creationStep === 'name' ? (
  
            <div className="space-y-4">
              <Input
                placeholder="e.g., Summer 2024 Western Parks"
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newPlanName.trim()) {
                    setCreationStep('parks');
                  }
                }}
              />
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setCreationStep('parks')}
                  disabled={!newPlanName.trim()}
                  className="bg-forest hover:bg-primary-hover"
                >
                  Next: Add Parks
                </Button>
              </div>
            </div>
          ) : (
     
            <div className="space-y-4">
              {}
              {selectedParks.length > 0 && (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <h4 className="font-semibold mb-3 text-sm">Selected Parks ({selectedParks.length})</h4>
                  <div className="space-y-2">
                    {selectedParks.map((park) => (
                      <div key={park.park_id} className="flex items-start justify-between bg-background p-3 rounded border">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{cleanParkName(park.park_name)}</p>
                          <p className="text-xs text-muted-foreground">{park.state}</p>
                          {park.user_notes && (
                            <p className="text-xs text-muted-foreground mt-1 italic">Note: {park.user_notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSelectedPark(park.park_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-sm">Search & Add Parks</h4>
                
                {!selectedParkForNote ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search parks by name, state, or description..."
                        value={parkSearchQuery}
                        onChange={(e) => setParkSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={fetchAvailableParks}
                        disabled={loadingParks}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>

                    {loadingParks ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : availableParks.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {availableParks.map((park) => {
                          const isAlreadySelected = selectedParks.some(p => p.park_id === park.park_id);
                          return (
                            <div
                              key={park.park_id}
                              className={`p-3 border rounded cursor-pointer transition-colors ${
                                isAlreadySelected
                                  ? 'bg-muted opacity-50 cursor-not-allowed'
                                  : 'bg-background hover:bg-muted'
                              }`}
                              onClick={() => !isAlreadySelected && handleAddParkToSelection(park)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-medium text-sm">{cleanParkName(park.park_name)}</p>
                                  <p className="text-xs text-muted-foreground">{park.state}</p>
                                </div>
                                {isAlreadySelected && (
                                  <Badge variant="secondary" className="text-xs">Added</Badge>
                                )}
                              </div>
                              {park.activities && Array.isArray(park.activities) && park.activities.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {park.activities.slice(0, 3).map((activity) => (
                                    <Badge 
                                      key={activity.activity_id} 
                                      variant="outline" 
                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                      {activity.activity_name}
                                    </Badge>
                                  ))}
                                  {park.activities.length > 3 && (
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                      +{park.activities.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : parkSearchQuery ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No parks found. Try a different search.</p>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">Search for parks to add them.</p>
                    )}
                  </div>
                ) : (
                
                  <div className="space-y-3 border-t pt-4">
                    <div className="bg-muted/50 p-3 rounded">
                      <p className="font-medium text-sm">{cleanParkName(selectedParkForNote.park_name)}</p>
                      <p className="text-xs text-muted-foreground">{selectedParkForNote.state}</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-foreground mb-2 block">Add Notes (Optional)</label>
                      <Textarea
                        placeholder="Add any notes about this park for your trip (e.g., best time to visit, must-see attractions, etc.)"
                        value={parkNoteInput}
                        onChange={(e) => setParkNoteInput(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedParkForNote(null);
                          setParkNoteInput("");
                        }}
                      >
                        Back to Search
                      </Button>
                      <Button
                        onClick={handleConfirmParkWithNotes}
                        className="bg-forest hover:bg-primary-hover flex-1"
                      >
                        Add to Trip Plan
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {}
              <div className="flex gap-3 justify-end border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreationStep('name');
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePlanWithParks}
                  disabled={creating || !newPlanName.trim()}
                  className="bg-forest hover:bg-primary-hover"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {creating ? 'Creating...' : 'Create Trip Plan'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {}
      <AlertDialog open={deletingPlanId !== null} onOpenChange={(open) => !open && setDeletingPlanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this trip plan? This action cannot be undone and all parks in this plan will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingPlanId && handleDeletePlan(deletingPlanId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {}
      <AlertDialog open={deletingParkId !== null} onOpenChange={(open) => !open && setDeletingParkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Park from Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this park from your trip plan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingParkId && handleRemovePark(deletingParkId.tripPlanId, deletingParkId.parkId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {}
      <Dialog open={editingPlanParks !== null} onOpenChange={(open) => {
        if (!open) {
          setEditingPlanParks(null);
          setEditPlanSearchQuery("");
          setEditPlanSelectedParkForNote(null);
          setEditPlanParkNoteInput("");
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Parks to Trip Plan</DialogTitle>
            <DialogDescription>
              Search for parks and add them to your trip plan with custom notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {!editPlanSelectedParkForNote ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search parks by name, state, or description..."
                    value={editPlanSearchQuery}
                    onChange={(e) => setEditPlanSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={fetchEditPlanAvailableParks}
                    disabled={editPlanLoadingParks}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {editPlanLoadingParks ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : editPlanAvailableParks.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {editPlanAvailableParks.map((park) => {
                      
                      const currentPlan = tripPlans.find(p => p.trip_plan_id === editingPlanParks);
                      const isAlreadyInPlan = currentPlan?.parks.some(p => p.park_id === park.park_id);
                      
                      return (
                        <div
                          key={park.park_id}
                          className={`p-3 border rounded cursor-pointer transition-colors ${
                            isAlreadyInPlan
                              ? 'bg-muted opacity-50 cursor-not-allowed'
                              : 'bg-background hover:bg-muted'
                          }`}
                          onClick={() => !isAlreadyInPlan && handleAddParkToExistingPlan(park)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">{cleanParkName(park.park_name)}</p>
                              <p className="text-xs text-muted-foreground">{park.state}</p>
                            </div>
                            {isAlreadyInPlan && (
                              <Badge variant="secondary" className="text-xs">In Plan</Badge>
                            )}
                          </div>
                          {park.activities && Array.isArray(park.activities) && park.activities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {park.activities.slice(0, 3).map((activity) => (
                                <Badge 
                                  key={activity.activity_id} 
                                  variant="outline" 
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {activity.activity_name}
                                </Badge>
                              ))}
                              {park.activities.length > 3 && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  +{park.activities.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : editPlanSearchQuery ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No parks found. Try a different search.</p>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Search for parks to add them.</p>
                )}
              </div>
            ) : (
              
              <div className="space-y-3 border-t pt-4">
                <div className="bg-muted/50 p-3 rounded">
                  <p className="font-medium text-sm">{cleanParkName(editPlanSelectedParkForNote.park_name)}</p>
                  <p className="text-xs text-muted-foreground">{editPlanSelectedParkForNote.state}</p>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-foreground mb-2 block">Add Notes (Optional)</label>
                  <Textarea
                    placeholder="Add any notes about this park for your trip (e.g., best time to visit, must-see attractions, etc.)"
                    value={editPlanParkNoteInput}
                    onChange={(e) => setEditPlanParkNoteInput(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditPlanSelectedParkForNote(null);
                      setEditPlanParkNoteInput("");
                    }}
                  >
                    Back to Search
                  </Button>
                  <Button
                    onClick={handleConfirmAddParkToExistingPlan}
                    className="bg-forest hover:bg-primary-hover flex-1"
                  >
                    Add to Trip Plan
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setEditingPlanParks(null)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;