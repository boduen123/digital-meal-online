import React, { useState, useEffect } from "react";
import axios from "axios"; // Import Axios
import {
  FaLock,
  FaArrowRight,
  FaQuestionCircle,
  FaUser,
  FaUtensils,
  FaSpinner,
  FaCheck,
  FaFingerprint,
  FaShieldAlt,
  FaUserCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { FaKey } from "react-icons/fa";
import { FaWhatsapp, FaPhone } from "react-icons/fa";

import { MdEmail, MdPerson, MdSecurity } from "react-icons/md";
import { HiCheckCircle } from "react-icons/hi";
import { BiScan } from "react-icons/bi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

// ==================== AXIOS CONFIG ====================
const api = axios.create({
  baseURL: "http://localhost:5000/api", // Ensure this matches backend port
});

// ==================== WebAuthn Helper ====================
const WebAuthnHelper = {
  // Basic support check
  isSupported: () =>
    typeof window !== "undefined" &&
    window.isSecureContext && // HTTPS or localhost
    "PublicKeyCredential" in window &&
    navigator.credentials &&
    typeof navigator.credentials.create === "function" &&
    typeof navigator.credentials.get === "function",

  // base64url
  toBase64Url: (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  },
  fromBase64Url: (base64url) => {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + "==".slice(0, (4 - (base64url.length % 4)) % 4);
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  },

  // data helpers
  utf8: (str) => new TextEncoder().encode(str),
  randomBytes: (len = 32) => {
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    return arr;
  },

  // RP ID (effective domain)
  rpId: () => {
    // Normalize rpId for localhost dev
    const host = window.location.hostname;
    if (host === "127.0.0.1") return "127.0.0.1"; // allowed since Chrome 127+, else use 'localhost'
    return host; // e.g. example.com or localhost
  },

  // Preflight checks to give user-friendly reasons
  async preflight() {
    if (!window.isSecureContext) {
      return { ok: false, reason: "Not secure context. Use HTTPS or http://localhost." };
    }
    if (!("PublicKeyCredential" in window)) {
      return { ok: false, reason: "WebAuthn not supported by this browser." };
    }
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        return { ok: false, reason: "No platform authenticator available (setup Touch ID / Face ID / Windows Hello)." };
      }
    } catch (e) {
      // continue; some browsers may throw here
    }
    return { ok: true };
  },

  async registerBiometric(username, displayName) {
    try {
      const pre = await WebAuthnHelper.preflight();
      if (!pre.ok) {
        return { success: false, error: pre.reason };
      }

      // Use a stable random user handle for this username (<= 64 bytes)
      const userHandles = JSON.parse(localStorage.getItem("webauthnUserHandles") || "{}");
      let userIdB64 = userHandles[username];
      if (!userIdB64) {
        userIdB64 = WebAuthnHelper.toBase64Url(WebAuthnHelper.randomBytes(32));
        userHandles[username] = userIdB64;
        localStorage.setItem("webauthnUserHandles", JSON.stringify(userHandles));
      }
      const userId = WebAuthnHelper.fromBase64Url(userIdB64);

      const publicKey = {
        challenge: WebAuthnHelper.randomBytes(32),
        rp: {
          name: "Igifu Food App",
          id: WebAuthnHelper.rpId(),
        },
        user: {
          id: userId,
          name: username,
          displayName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },   // ES256
          { type: "public-key", alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 120000,
        attestation: "none", // client demo
      };

      // Must be called from a user gesture (button click)
      const cred = await navigator.credentials.create({ publicKey });

      if (!cred) {
        return { success: false, error: "No credential returned (cancelled?)." };
      }

      const credentialId = WebAuthnHelper.toBase64Url(cred.rawId);
      const stored = JSON.parse(localStorage.getItem("biometricCredentials") || "{}");
      stored[username] = { credentialId, username, createdAt: new Date().toISOString() };
      localStorage.setItem("biometricCredentials", JSON.stringify(stored));

      return { success: true, credentialId };
    } catch (err) {
      if (err && err.name === "NotAllowedError") {
        return {
          success: false,
          error:
            "Not allowed or timed out. Ensure you accept the OS prompt, use HTTPS/localhost, and have Face/Touch ID or Windows Hello set up.",
        };
      }
      return { success: false, error: err?.message || "Registration failed." };
    }
  },

  async authenticateBiometric(username, { conditional = false } = {}) {
    try {
      const pre = await WebAuthnHelper.preflight();
      if (!pre.ok) {
        return { success: false, error: pre.reason };
      }

      const stored = JSON.parse(localStorage.getItem("biometricCredentials") || "{}");
      const userCred = stored[username];

      const publicKey = {
        challenge: WebAuthnHelper.randomBytes(32),
        rpId: WebAuthnHelper.rpId(),
        userVerification: "required",
        timeout: 120000,
      };

      if (userCred?.credentialId) {
        publicKey.allowCredentials = [
          {
            id: WebAuthnHelper.fromBase64Url(userCred.credentialId),
            type: "public-key",
            transports: ["internal"],
          },
        ];
      }

      // Passkeys conditional UI (optional). Only on supported browsers.
      const getOptions = { publicKey };
      if (conditional && "mediation" in navigator.credentials) {
        getOptions.mediation = "conditional";
      }

      const assertion = await navigator.credentials.get(getOptions);

      if (assertion) return { success: true, assertion };
      return { success: false, error: "Authentication failed." };
    } catch (err) {
      if (err && err.name === "NotAllowedError") {
        return {
          success: false,
          error:
            "Operation was blocked or timed out. Make sure you didn't dismiss the prompt and that biometrics/Windows Hello are configured.",
        };
      }
      return { success: false, error: err?.message || "Authentication failed." };
    }
  },

  hasBiometricRegistered: (username) => {
    const stored = JSON.parse(localStorage.getItem("biometricCredentials") || "{}");
    return !!stored[username];
  },
};

// ==================== Page Component ====================
const SignUpPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState("roleSelection");
  const [selectedRole, setSelectedRole] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmpassword: "",
    enableBiometric: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricRegistered, setBiometricRegistered] = useState(false);
  const [isRegisteringBiometric, setIsRegisteringBiometric] = useState(false);
  const [isAuthenticatingBiometric, setIsAuthenticatingBiometric] = useState(false);

  // New state for email verification
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [sentOtp, setSentOtp] = useState('');
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [fieldStatus, setFieldStatus] = useState({
    username: false,
    email: false,
    password: false,
    confirmpassword: false,
  });

  useEffect(() => {
    (async () => {
      // HTTPS or localhost
      if (!window.isSecureContext) {
        setBiometricAvailable(false);
        return;
      }
      if (!WebAuthnHelper.isSupported()) {
        setBiometricAvailable(false);
        return;
      }
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setBiometricAvailable(!!available);
      } catch {
        setBiometricAvailable(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isLogin && formData.username) {
      setBiometricRegistered(WebAuthnHelper.hasBiometricRegistered(formData.username));
    } else {
      setBiometricRegistered(false);
    }
  }, [formData.username, isLogin]);

  const triggerConfetti = async () => {
    try {
      const { default: confetti } = await import("canvas-confetti");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
      });
    } catch {
      // ignore if not available
    }
  };

  const handleRoleSelection = (role, isLoggingIn = false) => {
    setSelectedRole(role);
    setCurrentStep("form");
    setIsLogin(isLoggingIn);
    setTimeout(() => {
      document.querySelector(".form-container")?.classList.add("slide-in");
    }, 100);
  };

  const handleBackToRoleSelection = () => {
    setCurrentStep("roleSelection");
    setSelectedRole("");
    setFormData({
      username: "",
      email: "",
      password: "",
      confirmpassword: "",
      enableBiometric: false,
    });
    setIsLogin(false);
    setRegistrationSuccess(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = value;
    setFormData({ ...formData, [name]: updatedValue });

    if (name === "email") setFieldStatus((prev) => ({ ...prev, email: /\S+@\S+\.\S+/.test(updatedValue) }));
    if (name === "username") setFieldStatus((prev) => ({ ...prev, username: updatedValue.length >= 3 }));
    if (name === "password") setFieldStatus((prev) => ({ ...prev, password: updatedValue.length >= 4 }));
    if (name === "confirmpassword") {
      const passwordsMatch = updatedValue === formData.password && updatedValue.length >= 4;
      setFieldStatus((prev) => ({ ...prev, confirmpassword: passwordsMatch }));
      // Automatically show biometric prompt when passwords match during signup
      if (passwordsMatch && !isLogin && biometricAvailable && formData.username) {
        setShowBiometricPrompt(true);
      }
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleBiometricDecision = async (decision) => {
    if (decision) {
      // User clicked "Yes, Enable Now"
      setFormData(prev => ({ ...prev, enableBiometric: true }));
      await handleBiometricRegistration();
    }
    setShowBiometricPrompt(false); // Hide the modal after action
  };

  const handleBiometricRegistration = async () => {
    setIsRegisteringBiometric(true);
    toast.loading("Setting up biometric authentication...", { id: "biometric-setup" });

    const result = await WebAuthnHelper.registerBiometric(
      formData.username,
      `${selectedRole === "student" ? "Student" : "Restaurant"}: ${formData.username}`
    );

    setIsRegisteringBiometric(false);

    if (result.success) {
      toast.success("Biometric authentication enabled!", { id: "biometric-setup" });
      setBiometricRegistered(true);
      return true;
    } else {
      toast.error(`Failed to setup biometric: ${result.error}`, { id: "biometric-setup" });
      return false;
    }
  };

  const handleBiometricLogin = async () => {
    setIsAuthenticatingBiometric(true);
    toast.loading("Authenticating with biometric...", { id: "biometric-auth" });

    const result = await WebAuthnHelper.authenticateBiometric(formData.username);

    setIsAuthenticatingBiometric(false);

    if (result.success) {
      toast.success("Biometric authentication successful!", { id: "biometric-auth" });
      return true;
    } else {
      toast.error(`Biometric authentication failed: ${result.error}`, { id: "biometric-auth" });
      return false;
    }
  };

  const finalizeRegistration = async () => {
    try {
      // 1. Send registration data to backend via Axios
      await api.post('/auth/register', {
        username: formData.username, // maps to full_name
        email: formData.email,
        password: formData.password,
        role: selectedRole
      });

      // 2. Optional biometric setup (Client side handling for demo)
      if (formData.enableBiometric && biometricAvailable) {
        const ok = await handleBiometricRegistration();
        if (!ok) {
          toast("Account created. You can enable biometric later in settings.", { icon: "ℹ️" });
        }
      }

      setRegistrationSuccess(true);
      await triggerConfetti();
      toast.success("🎉 Registration successful! Please login to continue.");

      setTimeout(() => {
        setIsLogin(true);
        setRegistrationSuccess(false);
        setIsVerifyingEmail(false); // Reset verification step
        setEnteredOtp('');
        setFormData((prev) => ({
          ...prev,
          password: "",
          confirmpassword: "",
          enableBiometric: false,
        }));
      }, 1200);

    } catch (error) {
      console.error("Registration error", error);
      const errorMsg = error.response?.data?.message || "Registration failed. Please try again.";
      toast.error(errorMsg);
    }
  };

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginSuccess(false);

    try {
      if (isLogin) {
        // LOGIN FLOW
        let isSuccess = false;
        const path = selectedRole === "student" ? "/igifu-dashboard" : "/restaurant";

        // Try biometric first if available and registered
        if (biometricAvailable && biometricRegistered) {
          const ok = await handleBiometricLogin();
          if (ok) isSuccess = true; // In real app, validate assertion with backend here
        }

        // Fallback to password auth via Backend
        if (!isSuccess) {
          try {
            const response = await api.post('/auth/login', {
              username: formData.username,
              password: formData.password
            });
            
            // Save Token & User
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            isSuccess = true;
          } catch (error) {
            const errorMsg = error.response?.data?.message || "Invalid credentials.";
            toast.error(errorMsg);
          }
        }

        if (isSuccess) {
          setLoginSuccess(true);
          toast.success("Welcome back! Redirecting...");
          setTimeout(() => navigate(path), 1200);
        }
      } else {
        // SIGN UP FLOW
        if (formData.password !== formData.confirmpassword) {
          toast.error("Passwords do not match! Please re-enter.");
          setIsLoading(false);
          return;
        }
        if (!fieldStatus.email) {
          toast.error("Please enter a valid email address.");
          setIsLoading(false);
          return;
        }

        // Start email verification process (Client side OTP generation for demo)
        const otp = generateOtp();
        setSentOtp(otp);
        setIsVerifyingEmail(true);
        toast(`A verification code has been sent to your email. (Demo code: ${otp})`, {
          icon: '📧',
          duration: 6000,
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    if (enteredOtp === sentOtp) {
      toast.success("Email verified successfully!");
      await finalizeRegistration();
    } else {
      toast.error("Invalid verification code. Please try again.");
    }
    setIsLoading(false);
  };

  const handleQuickBiometricLogin = async () => {
    if (!formData.username) {
      toast.error("Please enter your username first");
      return;
    }
    const ok = await handleBiometricLogin();
    if (ok) {
      // For full security, this should trigger a backend call to issue a JWT based on WebAuthn assertion
      // For this integration, we prompt for password to sync session or assume success for demo flow
      toast("Biometric Verified. Please enter password to sync with server.", { icon: "🔒" });
    }
  };

  // Role Selection Screen
  if (currentStep === "roleSelection") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative py-6 font-sans">
        <Toaster position="top-center" />
        <button
          onClick={() => navigate("/")}
          className="absolute top-4 left-4 bg-yellow-400 text-gray-800 px-4 py-2 rounded-full font-semibold hover:bg-yellow-500 transition-all transform hover:scale-105 flex items-center shadow-lg"
        >
          <span className="mr-2">←</span> Back
        </button>

        <div className="text-center mt-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">Welcome to Igifu</h2>
          <p className="text-gray-600 text-lg">Choose how you want to join us</p>
          {biometricAvailable && (
            <div className="mt-3 flex items-center justify-center text-green-600 animate-pulse">
              <FaFingerprint className="mr-2" />
              <span className="text-sm">Biometric authentication available</span>
            </div>
          )}
          {!window.isSecureContext && (
            <div className="mt-3 text-xs text-red-600">
              WebAuthn requires HTTPS or http://localhost
            </div>
          )}
        </div>

        <div className="w-full max-w-md mt-8 space-y-4 px-4">
          <button
            onClick={() => handleRoleSelection("student")}
            className="w-full p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 flex items-center justify-between group transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-full group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300 transform group-hover:rotate-12">
                <FaUser className="text-blue-600 text-2xl" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold text-gray-800">I'm a Student</h3>
                <p className="text-gray-500 text-sm">Join to order food from restaurants</p>
              </div>
            </div>
            <FaArrowRight className="text-gray-400 group-hover:text-blue-600 transition-all transform group-hover:translate-x-2" />
          </button>

          <button
            onClick={() => handleRoleSelection("restaurant")}
            className="w-full p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-green-500 hover:bg-green-50 transition-all duration-300 flex items-center justify-between group transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-full group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300 transform group-hover:rotate-12">
                <FaUtensils className="text-green-600 text-2xl" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold text-gray-800">I'm a Restaurant Owner</h3>
                <p className="text-gray-500 text-sm">Register your restaurant with us</p>
              </div>
            </div>
            <FaArrowRight className="text-gray-400 group-hover:text-green-600 transition-all transform group-hover:translate-x-2" />
          </button>

          {/* Super Admin Login Button */}
          <a
            href="/super-admin-portal"
            className="w-full p-6 bg-white rounded-2xl shadow-xl border-2 border-transparent hover:border-purple-500 hover:bg-purple-50 transition-all duration-300 flex items-center justify-between group transform hover:scale-105 hover:shadow-2xl"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-full group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300 transform group-hover:rotate-12">
                <FaKey className="text-purple-600 text-2xl" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-semibold text-gray-800">Super Admin</h3>
                <p className="text-gray-500 text-sm">Access the admin portal</p>
              </div>
            </div>
            <FaArrowRight className="text-gray-400 group-hover:text-purple-600 transition-all transform group-hover:translate-x-2" />
          </a>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{" "}
            <button onClick={() => { setSelectedRole('student'); handleRoleSelection('student', true); }} className="text-blue-600 font-semibold hover:underline">Log In as Student</button> or {" "}
            <button onClick={() => { setSelectedRole('restaurant'); handleRoleSelection('restaurant', true); }} className="text-blue-600 font-semibold hover:underline">Log In as Restaurant</button>
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center text-gray-600">
          <MdSecurity className="mr-2 text-xl" />
          <span className="text-sm">Secured with end-to-end encryption</span>
        </div>
      </div>
    );
  }

  // Form Screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative py-6 font-sans">
      <Toaster position="top-center" />

      <button
        onClick={handleBackToRoleSelection}
        className="absolute top-4 left-4 bg-yellow-400 text-gray-800 px-4 py-2 rounded-full font-semibold hover:bg-yellow-500 transition-all transform hover:scale-105 flex items-center shadow-lg"
      >
        <span className="mr-2">←</span> Back to role selection
      </button>

      <div className="text-center mt-12 form-container">
        <div className="flex items-center justify-center mb-3">
          <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-3 rounded-full animate-bounce">
            {selectedRole === "student" ? (
              <FaUser className="text-blue-600 text-3xl" />
            ) : (
              <FaUtensils className="text-green-600 text-3xl" />
            )}
          </div>
        </div>
        <h4 className="text-2xl font-bold mb-2">
          <button
            className={`mr-3 transition-all ${
              !isLogin ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
          <span className="text-gray-400">|</span>
          <button
            className={`ml-3 transition-all ${
              isLogin ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setIsLogin(true)}
          >
            Log In
          </button>
        </h4>
        <p className="text-gray-600 text-sm">
          {isLogin
            ? `Welcome back, ${selectedRole === "student" ? "Student" : "Restaurant Owner"}!`
            : `Create your ${selectedRole === "student" ? "Student" : "Restaurant"} account`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-md mt-6 bg-white p-8 rounded-2xl shadow-2xl space-y-5 form-container">
        {registrationSuccess ? (
          <div className="text-center py-8">
            <div className="success-checkmark mx-auto mb-4">
              <HiCheckCircle className="text-green-500 text-6xl animate-bounce" />
            </div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">Registration Successful!</h3>
            <p className="text-gray-600">Redirecting to login...</p>
          </div>
        ) : (
          // ==================== RESTAURANT SIGNUP (CONTACT US) ====================
          !isLogin && selectedRole === 'restaurant' ? (
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Partnership Inquiry</h3>
              <p className="text-gray-600 mb-6">
                To register your restaurant, please contact our partnership team. We'll guide you through the setup process.
              </p>
              <div className="space-y-4">
                <a href="https://wa.me/250788123456" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-green-500 text-white rounded-full shadow-md hover:bg-green-600 transition-all transform hover:scale-105">
                  <FaWhatsapp className="text-2xl" />
                  <span className="font-semibold">Contact us on WhatsApp</span>
                </a>
                <a href="tel:+250788123456" className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-blue-500 text-white rounded-full shadow-md hover:bg-blue-600 transition-all transform hover:scale-105">
                  <FaPhone className="text-xl" />
                  <span className="font-semibold">Call for Assistance</span>
                </a>
                <a href="mailto:partners@igifu.com" className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-gray-700 text-white rounded-full shadow-md hover:bg-gray-800 transition-all transform hover:scale-105">
                  <MdEmail className="text-2xl" />
                  <span className="font-semibold">Send an Email</span>
                </a>
              </div>
              <p className="text-xs text-gray-500 mt-6">
                Our team is available to help you get started on the Igifu platform.
              </p>
            </div>
          ) : isVerifyingEmail ? (
            // ==================== EMAIL VERIFICATION STEP ====================
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Verify Your Email</h3>
              <p className="text-gray-600 mb-6">
                Enter the 6-digit code we sent to <strong>{formData.email}</strong>.
              </p>
              <div className="relative group mb-4">
                <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full px-12 py-3 rounded-full border-2 border-gray-300 text-center tracking-[0.5em] text-lg font-semibold focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isLoading || enteredOtp.length !== 6}
                className="w-full py-3 rounded-full font-semibold text-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 disabled:opacity-60"
              >
                {isLoading ? <FaSpinner className="animate-spin mx-auto" /> : 'Verify & Create Account'}
              </button>
              <button
                type="button"
                onClick={() => setIsVerifyingEmail(false)}
                className="mt-3 text-sm text-gray-500 hover:underline"
              >
                Back to sign up
              </button>
            </div>
          ) :
          // ==================== STUDENT SIGNUP / ALL LOGIN FORMS ====================
          <>
            {/* Username */}
            <div className="relative group">
              <MdPerson
                className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                  fieldStatus.username && !isLogin ? "text-green-500" : "text-gray-400"
                }`}
              />
              <input
                type="text"
                placeholder={
                  isLogin
                    ? selectedRole === "student"
                      ? "Username (e.g., student)"
                      : "Email (e.g., restaurant_admin@demo)"
                    : selectedRole === "student"
                    ? "Choose a username"
                    : "Restaurant Name"
                }
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`w-full px-10 py-3 rounded-full border-2 transition-all focus:ring-2 focus:ring-blue-500 ${
                  fieldStatus.username && !isLogin ? "border-green-500" : "border-gray-300"
                }`}
                required
              />
              {fieldStatus.username && !isLogin && (
                <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
              )}
            </div>

            {/* Email (Signup only) */}
            {!isLogin && (
              <div className="relative group">
                <MdEmail
                  className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                    fieldStatus.email ? "text-green-500" : "text-gray-400"
                  }`}
                />
                <input
                  type="email"
                  placeholder="Enter your email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-10 py-3 rounded-full border-2 transition-all focus:ring-2 focus:ring-blue-500 ${
                    fieldStatus.email ? "border-green-500" : "border-gray-300"
                  }`}
                  required
                />
                {fieldStatus.email && (
                  <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
            )}

            {/* Biometric Quick Login (Login only) */}
            {isLogin && biometricRegistered && biometricAvailable && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-2xl border-2 border-green-200">
                <button
                  type="button"
                  onClick={handleQuickBiometricLogin}
                  disabled={isAuthenticatingBiometric}
                  className="w-full flex items-center justify-center space-x-3 py-3 px-4 bg-white rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                >
                  {isAuthenticatingBiometric ? (
                    <>
                      <BiScan className="text-blue-600 text-2xl animate-pulse" />
                      <span className="font-semibold text-gray-700">Scanning...</span>
                    </>
                  ) : (
                    <>
                      <FaFingerprint className="text-green-600 text-2xl" />
                      <span className="font-semibold text-gray-700">Quick Login with Biometric</span>
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-500 mt-2">Or enter your password below</p>
              </div>
            )}

            {/* password */}
            <div className="relative group">
              <FaLock
                className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                  fieldStatus.password && !isLogin ? "text-green-500" : "text-gray-400"
                }`}
              />
              <input
                type="password"
                placeholder={isLogin ? (selectedRole === 'student' ? "Password (e.g., student123)" : "Password (e.g., demo123)") : "Create a secure password (min 4 characters)"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-10 py-3 rounded-full border-2 transition-all focus:ring-2 focus:ring-blue-500 ${
                  fieldStatus.password && !isLogin ? "border-green-500" : "border-gray-300"
                }`}
                required={!isLogin || !biometricRegistered}
              />
              <div className="group relative inline-block">
                <FaQuestionCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-500 cursor-help" />
                <div className="invisible group-hover:visible absolute right-0 top-8 bg-gray-800 text-white text-xs rounded-lg p-2 w-48 z-10">
                  password must be at least 4 characters
                </div>
              </div>
            </div>

            {/* Confirm password (Signup only) */}
            {!isLogin && (
              <div className="relative group">
                <FaShieldAlt
                  className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                    fieldStatus.confirmpassword ? "text-green-500" : "text-gray-400"
                  }`}
                />
                <input
                  type="password"
                  placeholder="Confirm your password"
                  name="confirmpassword"
                  value={formData.confirmpassword}
                  onChange={handleChange}
                  className={`w-full px-10 py-3 rounded-full border-2 transition-all focus:ring-2 focus:ring-blue-500 ${
                    fieldStatus.confirmpassword ? "border-green-500" : "border-gray-300"
                  }`}
                  required
                />
                {fieldStatus.confirmpassword && (
                  <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                )}
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              {!biometricAvailable && (
                <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 flex items-center space-x-2">
                  <FaExclamationTriangle className="text-yellow-600" />
                  <span className="text-sm text-gray-700">
                    Biometric authentication not available on this device (requires HTTPS and a configured platform authenticator).
                  </span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || loginSuccess || isRegisteringBiometric || isAuthenticatingBiometric}
              className={`w-full py-3 rounded-full font-semibold text-lg text-white transition-all duration-300 flex items-center justify-center transform hover:scale-105 shadow-lg
                ${loginSuccess ? "bg-gradient-to-r from-green-500 to-green-600" : "bg-gradient-to-r from-blue-500 to-indigo-600"} 
                ${!isLoading && !loginSuccess && !isRegisteringBiometric && !isAuthenticatingBiometric ? "hover:from-blue-600 hover:to-indigo-700" : ""}
                ${isLoading || loginSuccess || isRegisteringBiometric || isAuthenticatingBiometric ? "cursor-not-allowed opacity-90" : ""}`}
            >
              {isLoading || isRegisteringBiometric || isAuthenticatingBiometric ? (
                <>
                  <FaSpinner className="animate-spin text-xl mr-2" />
                  <span>
                    {isRegisteringBiometric
                      ? "Setting up biometric..."
                      : isAuthenticatingBiometric
                      ? "Authenticating..."
                      : "Processing..."}
                  </span>
                </>
              ) : loginSuccess ? (
                <>
                  <FaCheck className="text-xl mr-2 animate-bounce" />
                  <span>Success! Redirecting...</span>
                </>
              ) : (
                <span className="flex items-center">
                  {isLogin ? (
                    <>
                      <FaUserCheck className="mr-2" />
                      Log In as {selectedRole === "student" ? "Student" : "Restaurant Owner"}
                    </>
                  ) : (
                    <>
                      <FaShieldAlt className="mr-2" />
                      Create {selectedRole === "student" ? "Student" : "Restaurant"} Account
                    </>
                  )}
                </span>
              )}
            </button>

            {!isLogin && (
              <p className="text-center text-gray-500 text-xs">
                By creating an account, you agree to our{" "}
                <a href="/terms" className="text-blue-600 font-semibold hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" className="text-blue-600 font-semibold hover:underline">
                  Privacy Policy
                </a>
              </p>
            )}

            {isLogin && (
              <div className="text-center">
                <a href="/forgot-password" className="text-blue-600 text-sm hover:underline">
                  Forgot your password?
                </a>
              </div>
            )}

            <div className="flex items-center justify-center text-gray-500 text-xs mt-4">
              <MdSecurity className="mr-1" />
              <span>Your data is encrypted and secure</span>
            </div>
          </>
        )}
        {showBiometricPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFingerprint className="text-4xl text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Enable Biometric Login</h3>
              <p className="text-gray-600 mb-6">
                As a security measure, please set up your fingerprint or face to log in securely.
              </p>
              <div className="flex flex-col">
                <button
                  onClick={() => handleBiometricDecision(true)}
                  className="w-full py-3 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 transition-colors"
                >
                  Yes, Enable Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </form>

      <div className="text-center mt-6">
        {selectedRole === "student" ? (
          <p className="text-gray-600 text-sm">
            Are you a restaurant owner?{" "}
            <button
              onClick={() => handleRoleSelection("restaurant")}
              className="text-blue-600 font-semibold hover:underline transition-colors"
            >
              Switch to restaurant registration
            </button>
          </p>
        ) : (
          <div>
            <p className="text-gray-600 text-sm mb-3">Need help with restaurant registration?</p>
            <button className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 flex items-center mx-auto shadow-lg">
              Get Support <FaArrowRight className="ml-2" />
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .form-container { animation: slide-up 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default SignUpPage;