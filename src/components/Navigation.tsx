import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, User, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoggedIn, logout, deleteUser } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteUser();
      navigate("/auth");
    } catch (error) {
      console.error("Failed to delete account:", error);
      setIsDeleting(false);
    }
  };

  return (
    <nav className="bg-background border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-forest rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative bg-forest rounded-lg p-2">
                <MapPin className="h-6 w-6 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Terrain
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-forest ${
                location.pathname === "/" ? "text-forest" : "text-muted-foreground"
              }`}
            >
              Discover Parks
            </Link>
            <Link
              to="/profile"
              className={`text-sm font-medium transition-colors hover:text-forest ${
                location.pathname === "/profile" ? "text-forest" : "text-muted-foreground"
              }`}
            >
              My Trip Plans
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {isLoggedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm font-medium">{user.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">{user.username}</div>
                  <p className="px-2 py-1 text-xs text-muted-foreground">{user.email}</p>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      My Trip Plans
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)} 
                    className="text-destructive cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  );
};

export default Navigation;