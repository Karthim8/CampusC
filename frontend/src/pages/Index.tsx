import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import GoogleIcon from "@/components/GoogleIcon";
import GitHubIcon from "@/components/GitHubIcon";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

const Index = () => {
  const [step, setStep] = useState<"register" | "verify">("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle Registration Submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      console.log('Registration response status:', response.status);
      const data = await response.json();
      console.log('Registration response data:', data);

      if (response.ok) {
        toast.success("Verification code sent to your email!");
        setStep("verify");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (err) {
      console.error('Registration Fetch Error:', err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Code Verification
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      toast.error("Please enter a 6-digit code");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Email verified! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        toast.error(data.message || "Verification failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, hsla(175,80%,50%,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, hsla(260,60%,60%,0.05) 0%, transparent 50%)",
        }}
      />

      <AnimatePresence mode="wait">
        {step === "register" ? (
          <motion.div
            key="register"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card relative z-10 w-full max-w-md px-8 py-10"
          >
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="glow-text mb-2 text-3xl font-bold tracking-tight">
                Create Account
              </h1>
              <p className="text-sm text-muted-foreground">
                Join us and start your journey
              </p>
            </div>

            {/* Google OAuth */}
            <div className="space-y-3">
              <button onClick={handleGoogleSignIn} className="btn-google">
                <GoogleIcon />
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="divider-text my-6">or register with email</div>

            {/* Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="input-glass"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-glass"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-glass"
                  required
                />
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-primary mt-2"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? "Sending Code..." : "Create Account"}
              </motion.button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary transition-colors hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass-card relative z-10 w-full max-w-md px-8 py-10"
          >
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="glow-text mb-2 text-3xl font-bold tracking-tight">
                Verify Email
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to <br />
                <span className="font-medium text-foreground">{email}</span>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <label className="mb-1.5 block text-center text-xs font-medium text-muted-foreground">
                  Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="input-glass text-center text-2xl tracking-[1em]"
                  required
                  autoFocus
                />
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-primary"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {isLoading ? "Verifying..." : "Verify & Register"}
              </motion.button>

              <button
                type="button"
                onClick={() => setStep("register")}
                className="w-full text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                Wrong email? Go back
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
