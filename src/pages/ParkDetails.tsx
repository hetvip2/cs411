import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, DollarSign, AlertTriangle, Loader2, ArrowLeft, Compass } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/components/Navigation";
import { useTripPlan } from "@/contexts/TripPlanContext";
import { useAuth } from "@/contexts/AuthContext";
import { cleanParkName } from "@/lib/utils";
import heroYosemite from "@/assets/hero-yosemite.jpg";

const ParkDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parkData, setParkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { createTripPlan, addParkToPlan } = useTripPlan();
  const { user } = useAuth();
  const [creatingTripPlan, setCreatingTripPlan] = useState(false);

  useEffect(() => {
    const fetchParkData = async () => {
      if (!id) {
        setError("No park ID provided");
        setLoading(false);
        return;
      }

      try {
     
        const response = await fetch(
          `http://localhost:3001/api/items?limit=100`
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch park data");
        }

        const parks = await response.json();
        const park = parks.find((p: any) => String(p.park_id) === id || String(p.id) === id);
        
        if (park) {
          setParkData(park);
        } else {
          setParkData(getMockParkData(id));
        }
      } catch (err) {
        console.error("Error fetching park data:", err);
        setParkData(getMockParkData(id));
      } finally {
        setLoading(false);
      }
    };

    fetchParkData();
  }, [id]);

  const handlePlanTrip = async () => {
    if (!user || !parkData) return;
    
    setCreatingTripPlan(true);
    try {
 
      const planName = `Trip to ${cleanParkName(parkData.park_name || parkData.name)}`;
      const newPlan = await createTripPlan(planName);
      

      await addParkToPlan(newPlan.trip_plan_id, parkData.park_id);
      
  
      navigate('/profile');
    } catch (err) {
      console.error('Error creating trip plan:', err);
      alert('Failed to create trip plan. Please try again.');
    } finally {
      setCreatingTripPlan(false);
    }
  };

  const getMockParkData = (parkId: string | undefined) => {
    const mockData: Record<string, any> = {
      "1": {
        park_id: 1,
        id: "yosemite",
        park_name: "Yosemite National Park",
        state: "California",
        image: heroYosemite,
        description: "Yosemite National Park is in California's Sierra Nevada mountains. It's famed for its giant, ancient sequoia trees, and for Tunnel View, the iconic vista of towering Bridalveil Fall and the granite cliffs of El Capitan and Half Dome.",
        hours: "24 hours daily",
        fees: "$35 per vehicle (7 days)",
        activities: ["Hiking", "Rock Climbing", "Photography", "Camping", "Wildlife Viewing", "Waterfall Tours"]
      },
      "yosemite": {
        park_id: 1,
        id: "yosemite",
        park_name: "Yosemite National Park",
        state: "California",
        image: heroYosemite,
        description: "Yosemite National Park is in California's Sierra Nevada mountains. It's famed for its giant, ancient sequoia trees, and for Tunnel View, the iconic vista of towering Bridalveil Fall and the granite cliffs of El Capitan and Half Dome.",
        hours: "24 hours daily",
        fees: "$35 per vehicle (7 days)",
        activities: ["Hiking", "Rock Climbing", "Photography", "Camping", "Wildlife Viewing", "Waterfall Tours"]
      }
    };

    return mockData[parkId] || null;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-forest" />
          <span className="ml-3 text-lg text-muted-foreground">Loading park details...</span>
        </div>
      ) : error ? (
        <div className="py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => navigate("/")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      ) : parkData ? (
        <>
          {}
          <section className="relative h-[60vh] overflow-hidden">
            <img
              src={parkData.image || heroYosemite}
              alt={parkData.park_name || parkData.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-4">
                      <MapPin className="h-3 w-3 mr-1" />
                      {parkData.state}
                    </Badge>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg">
                      {cleanParkName(parkData.park_name || parkData.name)}
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {}
          <section className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="space-y-6">
                {}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Park Description</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                          {parkData.description}
                        </p>
                        
                        {parkData.activities && parkData.activities.length > 0 && (
                          <>
                            <h3 className="text-lg font-semibold mb-4">Popular Activities</h3>
                            <div className="flex flex-wrap gap-2">
                              {parkData.activities.map((activity: any, index: number) => (
                                <Badge key={index} variant="outline">
                                  {typeof activity === 'string' ? activity : activity.activity_name}
                                </Badge>
                              ))}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    {parkData.hours && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-forest" />
                            Hours
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{parkData.hours}</p>
                        </CardContent>
                      </Card>
                    )}

                    {parkData.fees && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <DollarSign className="h-5 w-5 mr-2 text-forest" />
                            Entrance Fees
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{parkData.fees}</p>
                        </CardContent>
                      </Card>
                    )}

                    {}
                    <Button 
                      onClick={handlePlanTrip}
                      disabled={creatingTripPlan}
                      className="w-full bg-forest hover:bg-primary-hover text-white h-12 text-base"
                    >
                      {creatingTripPlan ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Compass className="h-4 w-4 mr-2" />
                          Plan a Trip
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : (
        <div className="py-16 px-4 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Park not found</h2>
          <p className="text-muted-foreground mb-6">The park you're looking for doesn't exist.</p>
          <Button onClick={() => navigate("/")} className="bg-forest hover:bg-primary-hover">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      )}
    </div>
  );
};

export default ParkDetails;