import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import UploadPDF from "../components/UploadPDF";
import PDFEditor from "../components/PDFEditor";
import { apiConnector } from "../services/apiConnector";
import { DOCUMENT_API, PUBLIC_SIGNATURE_API } from "../services/apis";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { useNavigate } from "react-router-dom";
import {
  FaTrashAlt,
  FaFileSignature,
  FaFilter,
  FaTimes,
  FaPaperPlane,
  FaUserCheck,
  FaUserClock,
  FaSpinner,
  FaSearch,
  FaArrowLeft
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL;

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [filterStatus, setFilterStatus] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [docToRequest, setDocToRequest] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showSignersModal, setShowSignersModal] = useState(false);
  const [signers, setSigners] = useState([]);
  const [docForSigners, setDocForSigners] = useState(null);
  const [loadingSigners, setLoadingSigners] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const fetchDocuments = async () => {
    try {
      const res = await apiConnector("get", `https://doc-sign-server.onrender.com/api/docs`, null, {
        withCredentials: true,
      });
      if (Array.isArray(res?.documents)) {
        setDocuments(res.documents);
      } else {
        toast.error("Unexpected response from server");
      }
    } catch (err) {
      console.log(err);
      toast.error("Failed to fetch documents");
    }
  };

  const fetchSigners = async (documentId) => {
    try {
      setLoadingSigners(true);
      const res = await apiConnector(
        "get", 
        `https://doc-sign-server.onrender.com/api/public-signature/docSigner/${documentId}`,
        null,
        { withCredentials: true }
      );
      setSigners(res.signers || []);
    } catch (err) {
      console.error("Failed to fetch signers:", err);
      toast.error("Failed to load signer information");
    } finally {
      setLoadingSigners(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const filteredDocs = documents
    .filter((doc) => filterStatus === "All" || doc.status === filterStatus)
    .filter((doc) => 
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const confirmDelete = (doc) => {
    setDocToDelete(doc);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!docToDelete) return;
    try {
      await apiConnector("delete", DOCUMENT_API.DELETE(docToDelete._id), null, {
        withCredentials: true,
      });
      toast.success("Document deleted successfully");
      setDocuments((prev) => prev.filter((doc) => doc._id !== docToDelete._id));
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete document");
    } finally {
      setShowModal(false);
      setDocToDelete(null);
    }
  };

  const sendSignatureLink = async () => {
    if (!email) {
      toast.error("Please enter recipient's email");
      return;
    }
    try {
      setEmailLoading(true);
      await apiConnector("post", PUBLIC_SIGNATURE_API.REQUEST_LINK, {
        documentId: docToRequest._id,
        email,
      });
      toast.success("Signature request sent successfully!");
    } catch (err) {
      console.log(err);
      toast.error("Failed to send signature request");
    } finally {
      setEmail("");
      setDocToRequest(null);
      setShowEmailModal(false);
      setEmailLoading(false);
    }
  };

  const openSignersModal = (doc) => {
    setDocForSigners(doc);
    setShowSignersModal(true);
    fetchSigners(doc._id);
  };

  const viewSignature = (signer) => {
    navigate("/signature-preview", {
      state: { 
        signature: {
          x: signer.x,
          y: signer.y,
          width: signer.width,
          height: signer.height,
          page: signer.page,
          image: signer.image
        },
        document: docForSigners
      }
    });
  };

  const statusColors = {
    Signed: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Rejected: "bg-red-100 text-red-800"
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <AnimatePresence>
        {selectedDoc && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedDoc(null)}
            className="fixed top-4 left-4 z-10 flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 transition-colors"
          >
            <FaArrowLeft /> Back to Documents
          </motion.button>
        )}
      </AnimatePresence>

      {!selectedDoc && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-7xl mx-auto"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Your Documents</h1>
              <p className="text-gray-600">Manage and track all your PDF documents</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-grow">
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300">
                <FaFilter className="text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent focus:outline-none"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Signed">Signed</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <UploadPDF onUploadSuccess={fetchDocuments} />

          {filteredDocs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-xl shadow-sm p-8 text-center mt-8"
            >
              <img 
                src="/empty-state.svg" 
                alt="No documents" 
                className="w-64 mx-auto mb-6"
              />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchQuery ? "No matching documents found" : "No documents yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? "Try a different search term" 
                  : "Upload your first PDF to get started"}
              </p>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredDocs.map((doc) => (
                <motion.div
                  key={doc._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div 
                    className="cursor-pointer"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-800 truncate pr-2">
                          {doc.filename}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusColors[doc.status]}`}
                        >
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-4">
                        Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="border-t border-gray-100 h-64 relative">
                      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                        <Viewer 
                          fileUrl={`${SERVER_BASE_URL}/${doc.filepath}`} 
                          theme={{
                            theme: "light",
                            background: "#f9fafb"
                          }}
                        />
                      </Worker>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 p-3 flex justify-between">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openSignersModal(doc);
                      }}
                      className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 transition-colors"
                    >
                      <FaUserCheck size={12} /> Signers
                    </motion.button>
                    
                    <div className="flex gap-2">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDocToRequest(doc);
                          setShowEmailModal(true);
                        }}
                        className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 transition-colors"
                      >
                        <FaPaperPlane size={12} /> Request
                      </motion.button>
                      
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDelete(doc);
                        }}
                        className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 transition-colors"
                      >
                        <FaTrashAlt size={12} /> Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}

      {selectedDoc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="max-w-7xl mx-auto"
        >
          <PDFEditor document={selectedDoc} goBack={() => setSelectedDoc(null)} />
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <FaTrashAlt />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Delete Document
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete <span className="font-medium">"{docToDelete?.filename}"</span>? 
                This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <FaTrashAlt /> Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Request Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <FaPaperPlane />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">
                  Request Signature
                </h3>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient's Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={sendSignatureLink}
                  disabled={emailLoading}
                  className={`px-4 py-2 rounded-lg text-white flex items-center gap-2 transition-colors ${
                    emailLoading 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {emailLoading ? (
                    <>
                      <FaSpinner className="animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane /> Send Request
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Signers Modal */}
      <AnimatePresence>
        {showSignersModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      Document Signers
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {docForSigners?.filename}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSignersModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <FaTimes />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-grow">
                {loadingSigners ? (
                  <div className="flex justify-center items-center py-8">
                    <FaSpinner className="animate-spin text-2xl text-blue-500" />
                  </div>
                ) : signers.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <FaUserClock className="text-gray-400 text-3xl" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-700 mb-2">
                      No Signers Yet
                    </h4>
                    <p className="text-gray-500">
                      Send signature requests to get started
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {signers.map((signer, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="py-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              signer.isSigned ? "bg-green-100" : "bg-yellow-100"
                            }`}>
                              {signer.isSigned ? (
                                <FaUserCheck className={
                                  signer.isSigned ? "text-green-500" : "text-yellow-500"
                                } />
                              ) : (
                                <FaUserClock className="text-yellow-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {signer.email}
                              </p>
                              <p className="text-xs text-gray-500">
                                {signer.isSigned 
                                  ? "Signed on " + new Date(signer.signedAt).toLocaleDateString() 
                                  : "Pending signature"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              signer.isSigned 
                                ? "bg-green-100 text-green-800" 
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {signer.isSigned ? "Signed" : "Pending"}
                            </span>
                            {signer.isSigned && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => viewSignature(signer)}
                                className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                View
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
