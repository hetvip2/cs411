import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import heroYosemite from "@/assets/hero-yosemite.jpg";

const Auth = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();


  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

 
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

 
  const hashPassword = (password: string): string => {
    return btoa(password); 
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      if (!loginEmail || !loginPassword) {
        setLoginError("Please fill in all fields");
        setLoginLoading(false);
        return;
      }

    
      const response = await fetch(
        `http://localhost:3001/api/users/email/${encodeURIComponent(loginEmail)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setLoginError("User not found. Please check your email or sign up.");
        } else {
          setLoginError("Failed to login. Please try again.");
        }
        setLoginLoading(false);
        return;
      }

      const data = await response.json();
      const user = data.user;

     
      const hashedPassword = hashPassword(loginPassword);
      if (hashedPassword !== user.password_hash) {
        setLoginError("Invalid password. Please try again.");
        setLoginLoading(false);
        return;
      }


      login({
        user_id: user.user_id,
        username: user.username,
        email: user.email
      });

      console.log("User logged in:", user.username);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setLoginError("An error occurred during login. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError("");
    setSignupLoading(true);

    try {
      if (!signupUsername || !signupEmail || !signupPassword || !signupConfirmPassword) {
        setSignupError("Please fill in all fields");
        setSignupLoading(false);
        return;
      }

      if (signupPassword !== signupConfirmPassword) {
        setSignupError("Passwords do not match");
        setSignupLoading(false);
        return;
      }

      if (signupPassword.length < 6) {
        setSignupError("Password must be at least 6 characters");
        setSignupLoading(false);
        return;
      }

      // Hash the password
      const hashedPassword = hashPassword(signupPassword);

      // Create user
      const response = await fetch("http://localhost:3001/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          username: signupUsername,
          email: signupEmail,
          password_hash: hashedPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setSignupError(errorData.error || "Failed to create account");
        setSignupLoading(false);
        return;
      }

      const data = await response.json();
      const user = data.user;

     
      signup({
        user_id: user.user_id,
        username: user.username,
        email: user.email
      });

      console.log("User signed up:", user.username);
      navigate("/");
    } catch (error) {
      console.error("Signup error:", error);
      setSignupError("An error occurred during signup. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={heroYosemite}
          alt="National Park"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-transparent" />
        
        {}
        <div className="absolute inset-0 flex flex-col items-start justify-center p-12">
          <div className="flex items-center space-x-3 mb-8">
            <MapPin className="h-10 w-10 text-white" />
            <span className="text-4xl font-bold text-white">Terrain</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Discover America's
            <br />
            <span className="bg-gradient-sunset bg-clip-text text-transparent">
              Natural Wonders
            </span>
          </h1>
          <p className="text-xl text-white/90 max-w-md drop-shadow-lg">
            Plan your perfect national park adventure with real-time weather, alerts, and personalized trip planning.
          </p>
        </div>
      </div>

      {}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <MapPin className="h-8 w-8 text-forest" />
            </div>
            <CardTitle className="text-3xl">Welcome to Terrain</CardTitle>
            <CardDescription className="text-base">
              Plan your national park adventure
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login" className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      disabled={loginLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loginLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-forest hover:bg-primary-hover"
                    disabled={loginLoading}
                  >
                    {loginLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  {signupError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{signupError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input
                      id="signup-username"
                      type="text"
                      placeholder="Choose a username"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      disabled={signupLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      disabled={signupLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      disabled={signupLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      disabled={signupLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-forest hover:bg-primary-hover"
                    disabled={signupLoading}
                  >
                    {signupLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Sign Up"
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    Password must be at least 6 characters
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
