import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";
import { auth, db, googleProvider, handleFirestoreError, OperationType } from "../firebase";
import { UserProfile, UserRole } from "../types";

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  users: UserProfile[]; // all registered users in the system for assignments
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  signInWithDemo: (role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  updateUserProfile: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      if (fbUser) {
        setUser(fbUser);
        const userDocRef = doc(db, "users", fbUser.uid);
        
        try {
          const userSnap = await getDoc(userDocRef);
          
          if (userSnap.exists()) {
            setProfile(userSnap.data() as UserProfile);
          } else {
            // First time sign-in, register as Developer (or can be configured in UI)
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || "",
              name: fbUser.displayName || "Anonymous User",
              role: "Developer", // default role on first sign up
              createdAt: serverTimestamp()
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync all users for assignment dropdowns
  useEffect(() => {
    if (!user) {
      setUsers([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const list: UserProfile[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as UserProfile);
        });
        setUsers(list);
      },
      (error) => {
        console.error("Error fetching all users:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, "auth/popup");
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string, role: UserRole) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      const userDocRef = doc(db, "users", fbUser.uid);
      const newProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email || email,
        name: name || "Anonymous User",
        role: role,
        createdAt: serverTimestamp()
      };
      await setDoc(userDocRef, newProfile);
      setProfile(newProfile);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithDemo = async (role: UserRole) => {
    setLoading(true);
    const storageKey = `teamflow_demo_suffix_${role}`;
    let suffix = localStorage.getItem(storageKey);
    if (!suffix) {
      // Use appletSuffix as the initial default seed
      suffix = "17580bb9";
      localStorage.setItem(storageKey, suffix);
    }
    
    let email = `${role.toLowerCase()}.${suffix}@teamflow.com`;
    const password = "password123";
    const name = `Demo ${role}`;
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        const userDocRef = doc(db, "users", fbUser.uid);
        const newProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || email,
          name: name,
          role: role,
          createdAt: serverTimestamp()
        };
        await setDoc(userDocRef, newProfile);
        setProfile(newProfile);
      } catch (signUpErr: any) {
        if (signUpErr.code === "auth/email-already-in-use" || signUpErr.message?.includes("email-already-in-use")) {
          try {
            await signInWithEmailAndPassword(auth, email, password);
          } catch (retryErr) {
            console.warn("Credential collision or wrong password on demo account. Rotating suffix...");
            const newSuffix = Math.random().toString(36).substring(2, 8);
            localStorage.setItem(storageKey, newSuffix);
            const newEmail = `${role.toLowerCase()}.${newSuffix}@teamflow.com`;
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, newEmail, password);
              const fbUser = userCredential.user;
              
              const userDocRef = doc(db, "users", fbUser.uid);
              const newProfile: UserProfile = {
                uid: fbUser.uid,
                email: fbUser.email || newEmail,
                name: name,
                role: role,
                createdAt: serverTimestamp()
              };
              await setDoc(userDocRef, newProfile);
              setProfile(newProfile);
            } catch (fallbackErr: any) {
              console.error("Critical fallback demo registration failed:", fallbackErr);
              throw fallbackErr;
            }
          }
        } else {
          console.error("Failed to auto-register demo user:", signUpErr);
          throw signUpErr;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
  };

  // Admin capability to update other users' roles
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    const userDocRef = doc(db, "users", userId);
    try {
      await updateDoc(userDocRef, { role: newRole });
      // If we are updating ourselves, update state local profile copy
      if (user && user.uid === userId && profile) {
        setProfile({ ...profile, role: newRole });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const updateUserProfile = async (name: string) => {
    if (!user) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      await updateDoc(userDocRef, { name });
      if (profile) {
        setProfile({ ...profile, name });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        users,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInWithDemo,
        signOut,
        updateUserRole,
        updateUserProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
