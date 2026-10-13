import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface Activity {
  activity_id?: number;
  activity_name?: string;
  description?: string;
}

interface ParkCardProps {
  id: string;
  name: string;
  state: string;
  description: string;
  image: string;
  activities: (string | Activity)[];
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
}

const getActivityName = (activity: string | Activity): string => {
  if (typeof activity === 'string') {
    return activity;
  }
  return activity.activity_name || '';
};

const ParkCard = ({ 
  id, 
  name, 
  state, 
  description, 
  image, 
  activities, 
  isSaved = false,
  onToggleSave 
}: ParkCardProps) => {
  return (
    <Card className="group overflow-hidden shadow-card hover:shadow-hero transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative">
        <img
          src={image}
          alt={name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-4 left-4">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            <MapPin className="h-3 w-3 mr-1" />
            {state}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-6">
        <Link to={`/park/${id}`}>
          <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-forest transition-colors">
            {name}
          </h3>
        </Link>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="flex flex-wrap gap-2">
          {activities.slice(0, 3).map((activity, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {getActivityName(activity)}
            </Badge>
          ))}
          {activities.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{activities.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ParkCard;