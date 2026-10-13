import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, AlertCircle, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/components/Navigation";

interface Park {
  id?: string;
  park_id?: string;
  park_name: string;
  state: string;
  description: string;
  activities?: Array<{
    activity_id: number;
    activity_name: string;
    description?: string;
  }>;
  [key: string]: any;
}

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [results, setResults] = useState<Park[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const query = searchParams.get("q") || "";

  useEffect(() => {
    if (query.trim()) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:3001/api/search?q=${encodeURIComponent(searchTerm)}&limit=50`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch search results");
      }
      
      const data = await response.json();
      setResults(data);
      
      if (data.length === 0) {
        setError(`No parks found matching "${searchTerm}". Try a different search.`);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search parks. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
      performSearch(searchQuery);
    }
  };

  const handleParkClick = (parkId: string | undefined) => {
    if (parkId) {
      navigate(`/park/${parkId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {}
      <section className="py-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-forest/5 to-transparent">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Search Results
          </h1>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex">
              <Input
                type="text"
                placeholder="Search parks by name, location, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-12 text-base"
              />
              <Button
                type="submit"
                disabled={loading}
                className="h-12 px-6 ml-2 bg-forest hover:bg-primary-hover"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>

          {query && (
            <p className="text-sm text-muted-foreground mt-4">
              Showing results for <span className="font-medium text-foreground">"{query}"</span>
            </p>
          )}
        </div>
      </section>

      {}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-forest" />
              <span className="ml-3 text-lg text-muted-foreground">Searching parks...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-6">
                Found {results.length} park{results.length !== 1 ? "s" : ""}
              </p>
              {results.map((park, index) => (
                <Card
                  key={index}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleParkClick(park.park_id || park.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">
                          {park.park_name}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{park.state}</span>
                        </div>
                      </div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleParkClick(park.park_id || park.id);
                        }}
                        className="bg-forest hover:bg-primary-hover"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2 mb-4">
                      {park.description}
                    </p>
                    {}
                    {park.activities && Array.isArray(park.activities) && park.activities.length > 0 && (
                      <div className="flex flex-wrap gap-2">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !loading && query ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No parks found
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or browse our featured parks on the home page.
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Start searching for parks
              </h3>
              <p className="text-muted-foreground">
                Enter a park name, location, or keyword in the search box above.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SearchResults;
