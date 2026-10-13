import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, TrendingUp, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ParkCard from "@/components/ParkCard";
import Navigation from "@/components/Navigation";
import { cleanParkName } from "@/lib/utils";
import heroYosemite from "@/assets/hero-yosemite.jpg";
import grandCanyon from "@/assets/grand-canyon.jpg";
import yellowstone from "@/assets/yellowstone.jpg";
import rockyMountains from "@/assets/rocky-mountains.jpg";
import ParksMap from "@/components/ParkMaps";

const HomePage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredParks, setFeaturedParks] = useState<any[]>([]);
  const [loadingParks, setLoadingParks] = useState(true);
  const [popularParks, setPopularParks] = useState<any[]>([]);
  const [activityParks, setActivityParks] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);


  const parkImages: { [key: string]: string } = {
    "61": heroYosemite,
    "23": grandCanyon,
    "60": yellowstone,
    "50": rockyMountains,
  };

  const parkIds = ["61", "23", "60", "50"];

  useEffect(() => {
    const fetchFeaturedParks = async () => {
      setLoadingParks(true);
      try {

        const response = await fetch(`http://localhost:3001/api/items?limit=100`);
        if (!response.ok) {
          throw new Error("Failed to fetch parks");
        }
        const allParks = await response.json();

 
        const featured = parkIds
          .map((id) => {
            const park = allParks.find((p: any) => String(p.park_id) === id);
            if (park) {
              return {
                id: String(park.park_id),
                name: cleanParkName(park.park_name),
                state: park.state,
                description: park.description,
                image: parkImages[id] || heroYosemite,
                activities: park.activities || [],
              };
            }
            return null;
          })
          .filter((park: any) => park !== null);

        setFeaturedParks(featured);
      } catch (err) {
        console.error("Error fetching featured parks:", err);
        setFeaturedParks([]);
      } finally {
        setLoadingParks(false);
      }
    };

    fetchFeaturedParks();
    fetchParkStatistics();
  }, []);

  const fetchParkStatistics = async () => {
    setLoadingStats(true);
    try {
  
      const popularResponse = await fetch(
        `http://localhost:3001/api/parks/popular`
      );
      if (popularResponse.ok) {
        const popularData = await popularResponse.json();
        setPopularParks(popularData);
      }

  
      const activityResponse = await fetch(
        `http://localhost:3001/api/parks/most-activities`
      );
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivityParks(activityData);
      }
    } catch (err) {
      console.error("Error fetching park statistics:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${heroYosemite})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
            Find Your Next
            <span className="block bg-gradient-sunset bg-clip-text text-transparent">
              Adventure
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
            Discover America's most beautiful national parks.
          </p>

          <form onSubmit={handleSearch} className="flex max-w-lg mx-auto">
            <div className="flex w-full shadow-hero">
              <Input
                type="text"
                placeholder="Find your next adventure..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-14 text-lg bg-background/95 backdrop-blur-sm border-r-0 rounded-r-none"
              />
              <Button
                type="submit"
                className="h-14 px-6 rounded-l-none bg-forest hover:bg-primary-hover"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </section>

      {}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Featured National Parks
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explore some of America's most iconic natural wonders and start
              planning your perfect adventure.
            </p>
          </div>

          {loadingParks ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-forest" />
              <span className="ml-3 text-lg text-muted-foreground">
                Loading featured parks...
              </span>
            </div>
          ) : featuredParks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredParks.map((park) => (
                <ParkCard key={park.id} {...park} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Unable to load featured parks at this time.
              </p>
            </div>
          )}
        </div>
      </section>

      {}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                Explore All Parks on the Map
              </h2>
              <p className="text-muted-foreground max-w-xl">
                Pan and zoom around the United States and click any marker to
                jump straight to that park&apos;s details.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border shadow-soft overflow-hidden h-[450px]">
            <ParksMap />
          </div>
        </div>
      </section>

      {}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-8 w-8 text-forest" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Most Popular Parks
                </h2>
              </div>
              <p className="text-lg text-muted-foreground mb-8">
                Parks loved by most trip planners
              </p>

              {loadingStats ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-forest" />
                  <span className="ml-3 text-muted-foreground">
                    Loading statistics...
                  </span>
                </div>
              ) : popularParks.length > 0 ? (
                <div className="space-y-4">
                  {popularParks.map((park, index) => (
                    <div
                      key={park.park_id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:shadow-card transition-shadow cursor-pointer group"
                      onClick={() => navigate(`/park/${park.park_id}`)}
                    >
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-forest text-white font-bold">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-forest transition-colors">
                          {cleanParkName(park.park_name)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {park.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-forest">
                          {park.trip_count || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          trips planned
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No statistics available yet
                  </p>
                </div>
              )}
            </div>

            {}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Zap className="h-8 w-8 text-sunset" />
                <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                  Most Activity-Rich Parks
                </h2>
              </div>
              <p className="text-lg text-muted-foreground mb-8">
                Parks with the most things to do
              </p>

              {loadingStats ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-forest" />
                  <span className="ml-3 text-muted-foreground">
                    Loading statistics...
                  </span>
                </div>
              ) : activityParks.length > 0 ? (
                <div className="space-y-4">
                  {activityParks.map((park, index) => (
                    <div
                      key={park.park_id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:shadow-card transition-shadow cursor-pointer group"
                      onClick={() => navigate(`/park/${park.park_id}`)}
                    >
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-sunset text-white font-bold">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-sunset transition-colors">
                          {cleanParkName(park.park_name)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {park.state}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-sunset">
                          {park.activity_count || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          activities
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No statistics available yet
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="py-16 bg-gradient-hero">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Plan Your Adventure?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Create your personalized trip plans and never miss important park
            updates.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8 py-4"
            onClick={() => navigate("/profile")}
          >
            Start Planning Today
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
