import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearUser } from "../utils/auth/authSlice";
import { useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaFileSignature } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  const handleLogout = () => {
    dispatch(clearUser());
    navigate("/login");
  };

  if (!isAuthenticated) return null;

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-gradient-to-r from-indigo-600 to-blue-600 shadow-lg px-6 py-3 flex justify-between items-center  top-0 z-40"
    >
      <div 
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 cursor-pointer group"
      >
        <FaFileSignature className="text-white text-2xl group-hover:scale-110 transition-transform" />
        <h1 className="text-xl font-bold text-white group-hover:text-indigo-200 transition-colors">
          DocuSign Pro
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <div 
          className="flex items-center gap-2 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="relative">
            <FaUser className="text-white" />
            {isHovering && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full mt-2 left-0 bg-white text-gray-800 text-sm px-3 py-1 rounded shadow-lg whitespace-nowrap"
              >
                {user?.email || "User email"}
              </motion.div>
            )}
          </div>
          <span className="font-medium">{user?.name || "User"}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-md"
        >
          <FaSignOutAlt />
          Logout
        </motion.button>
      </div>

      <AnimatePresence>
        {showLogoutModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 shadow-2xl w-full max-w-md mx-4"
            >
              <h3 className="text-xl font-bold mb-3 text-gray-800">
                Ready to leave?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-colors"
                >
                  Yes, Logout
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;