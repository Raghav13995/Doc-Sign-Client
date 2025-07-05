import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register";
import VerifyOtp from "./pages/VerifyOtp";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicSigner from "./pages/PublicSigner";
import Home from "./pages/Home.jsx";
import Navbar from "./components/Navbar";
import { Toaster } from "react-hot-toast";
import SignaturePreviewPublic from "./pages/SignaturePreviewPublic.jsx";

function AppContent() {
  const location = useLocation();
  const isLoggedIn = !!localStorage.getItem("token");

  // Define routes where Navbar should be hidden
  const hideNavbarOn = ["/", "/login", "/register", "/verify-otp"];
  const isPublicSignerRoute = location.pathname.startsWith("/sign/");
  const shouldHideNavbar = hideNavbarOn.includes(location.pathname) || isPublicSignerRoute;

  return (
    <div className="min-h-screen bg-gray-50">
      {!shouldHideNavbar && <Navbar isLoggedIn={isLoggedIn} />}

      <div className="p-4">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/signature-preview" element={<SignaturePreviewPublic />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/sign/:token" element={<PublicSigner />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      <Router>
        <AppContent />
      </Router>
    </>
  );
}

export default App;
