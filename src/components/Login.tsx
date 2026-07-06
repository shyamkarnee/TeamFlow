import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Briefcase, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  AlertCircle, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  AlertTriangle,
  UserCheck,
  Building
} from "lucide-react";
import { UserRole } from "../types";

export const Login: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, signInWithDemo, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'demo' | 'email'>('demo');
  const [isSignUp, setIsSignUp] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("Developer");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      setSubmitting(false);
      return;
    }

    try {
      if (isSignUp) {
        if (!name) {
          setErrorMsg("Please enter your name.");
          setSubmitting(false);
          return;
        }
        await signUpWithEmail(email, password, name, role);
        setSuccessMsg("Account created successfully!");
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      const message = err.message || String(err);
      if (message.includes("auth/email-already-in-use") || message.includes("email-already-in-use")) {
        setErrorMsg("This email is already registered. Try signing in instead.");
      } else if (message.includes("auth/weak-password") || message.includes("weak-password")) {
        setErrorMsg("Password should be at least 6 characters.");
      } else if (message.includes("auth/invalid-email") || message.includes("invalid-email")) {
        setErrorMsg("Please enter a valid email address.");
      } else if (
        message.includes("auth/invalid-credential") || 
        message.includes("wrong-password") || 
        message.includes("user-not-found")
      ) {
        if (!isSignUp) {
          setErrorMsg("Account does not exist or password is incorrect. Please create an account first!");
        } else {
          setErrorMsg("Invalid credentials. Please verify your email and password.");
        }
      } else {
        setErrorMsg("Authentication failed: " + (err.message || String(err)));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoSignIn = async (selectedRole: UserRole) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);
    try {
      await signInWithDemo(selectedRole);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to initiate demo session: " + (err.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const isGlobalLoading = loading || submitting;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Header Visual */}
        <div className="bg-slate-900 p-8 text-white flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl -mr-8 -mt-8" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl -ml-8 -mb-8" />
          
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 border border-white/20">
            <Briefcase className="w-6 h-6 text-indigo-400" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">TeamFlow</h1>
          <p className="text-sm text-slate-400 mt-1">Systems Engineering Assignment Platform</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-slate-600 text-xs text-center leading-relaxed mb-6">
            TeamFlow is a unified workspace for managing projects, executing tasks, tracking dependencies, and managing incident resolution workflows.
          </p>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              id="tab-demo"
              type="button"
              onClick={() => { setActiveTab('demo'); setErrorMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 text-xs font-semibold rounded-lg transition-all ${activeTab === 'demo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Demo Access
            </button>
            <button
              id="tab-email"
              type="button"
              onClick={() => { setActiveTab('email'); setErrorMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-1 py-2 px-1 text-xs font-semibold rounded-lg transition-all ${activeTab === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              Email & Pass
            </button>
          </div>

          {/* Notifications */}
          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 flex items-start gap-2.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Notice</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 flex items-start gap-2.5 leading-relaxed">
              <UserCheck className="w-4 h-4 shrink-0 text-green-500 mt-0.5" />
              <div>
                <p className="font-semibold">Success</p>
                <p>{successMsg}</p>
              </div>
            </div>
          )}

          {/* Demo Access Panel */}
          {activeTab === 'demo' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 text-center mb-4">
                No setup required! Click any card to enter with pre-configured developer, manager, or admin test profiles.
              </p>

              <button
                id="demo-admin-btn"
                type="button"
                onClick={() => handleDemoSignIn("Admin")}
                disabled={isGlobalLoading}
                className="w-full text-left p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Demo Administrator
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full">Full Control</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Manage users, adjust roles, and review master logs.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                id="demo-manager-btn"
                type="button"
                onClick={() => handleDemoSignIn("Manager")}
                disabled={isGlobalLoading}
                className="w-full text-left p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center group-hover:bg-sky-100 transition-colors shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Demo Project Manager
                    <span className="text-[9px] bg-sky-100 text-sky-700 font-semibold px-1.5 py-0.5 rounded-full">Manager</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Define projects, create tasks, and manage incident blockers.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>

              <button
                id="demo-dev-btn"
                type="button"
                onClick={() => handleDemoSignIn("Developer")}
                disabled={isGlobalLoading}
                className="w-full text-left p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all flex items-center gap-4 group"
              >
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    Demo Developer
                    <span className="text-[9px] bg-emerald-100 text-emerald-700 font-semibold px-1.5 py-0.5 rounded-full">Developer</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">Claim open tasks, complete prerequisites, and submit deliverables.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </button>
            </div>
          )}

          {/* Email Login/Signup Panel */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="signup-name-input"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Desired Role</label>
                    <select
                      id="signup-role-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 font-medium"
                    >
                      <option value="Developer">Developer</option>
                      <option value="Manager">Project Manager</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
                    required
                  />
                </div>
              </div>

              <button
                id="email-submit-btn"
                type="submit"
                disabled={isGlobalLoading}
                className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGlobalLoading ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isSignUp ? "Create Account & Sign In" : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  id="toggle-signup-btn"
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
                >
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-[11px] text-slate-400 mt-8 leading-tight">
            Protected by Cloud Firestore attribute-based access rules. User roles dictate project boundaries.
          </p>
        </div>
      </div>
    </div>
  );
};
