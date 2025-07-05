import { useEffect, useRef, useState, useCallback } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Rnd } from "react-rnd";
import { apiConnector } from "../services/apiConnector";
import { toast } from "react-hot-toast";
import { Viewer, Worker } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { PDFDocument } from "pdf-lib";
// import { SIGNATURE_API } from "../services/apis";
import SavedSignatureModal from "./SavedSignatureModal ";
import TextSignatureModal from "./TextSignatureModal";
import {
  FaDownload,
  FaSave,
  FaPenFancy,
  FaEye,
  FaSign,
  FaArrowLeft,
  FaUniversity,
  FaTimes,
  FaFont,
} from "react-icons/fa";

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL;

const PDFEditor = ({ document: pdfDoc, goBack, isPublic = false, onComplete,token }) => {
  const [signatures, setSignatures] = useState([]);
  const [signMode, setSignMode] = useState(true);
  const [showPad, setShowPad] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef();
  const sigPadRef = useRef();
  

  const fetchSavedSignatureImage = async () => {
    try {
      const res = await apiConnector("get", `http://localhost:5000/api/saved-signature/me`, null, {
        withCredentials: true,
      });
      if (res?.signatureImage) {
        setSignatureImage(res.signatureImage);
        toast.success("Loaded saved signature");
      }
    } catch (err) {
      console.log(err);
      console.warn("No saved signature found");
    }
  };

  const saveSignature = async () => {
    if (!sigPadRef.current.isEmpty()) {
      const dataUrl = sigPadRef.current.getCanvas().toDataURL("image/png");
      setSignatureImage(dataUrl);
      setShowPad(false);
      toast.success("Signature saved locally. Click to place it.");

      try {
        await apiConnector("post", `http://localhost:5000/api/saved-signature/save`, { image: dataUrl }, {
          withCredentials: true,
        });
        toast.success("Signature saved for future use");
      } catch {
        toast.error("Failed to save signature to server");
      }
    } else {
      toast.error("Please draw your signature first");
    }
  };

  const handlePlaceSignature = (e) => {
    // if (!signMode || !signatureImage || signatures.length > 0) return;
    if (!signMode || !signatureImage || 
        e.target.closest('.react-rnd') || 
        e.target.closest('.resize-handle')) {
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 50;
    const y = e.clientY - rect.top - 25;

    const newSig = {
      x,
      y,
      page: currentPage,
      image: signatureImage,
      width: 100,
      height: 50,
    };

    setSignatures([newSig]);
    toast.success(`Signature placed on page ${currentPage}`);
  };

  const handleSaveToServer = async () => {
    try {
      for (const sig of signatures) {
        await apiConnector("post", "http://localhost:5000/api/signatures", {
          documentId: pdfDoc._id,
          x: sig.x,
          y: sig.y,
          page: sig.page,
          signStatus: "signed",
          image: sig.image,
          width: sig.width,
          height: sig.height,
        }, {
          withCredentials: true,
        });
      }
      toast.success("Signatures saved to server");
    } catch (err) {
      console.log(err)
      toast.error("Failed to save signatures");
    }
  };
  const handleSubmit = async () => {
    if (!signatures.length) return toast.error("No signatures placed to submit");
    try {
      for (const sig of signatures) {
        await apiConnector("post", `http://localhost:5000/api/public-signature/submit/${token}`, {
          documentId: pdfDoc._id,
          x: sig.x,
          y: sig.y,
          page: sig.page,
          image: sig.image,
          width: sig.width,
          height: sig.height,
        }, {
          withCredentials: true,  
        });
      }
      toast.success("Signatures submitted successfully");
      if (isPublic && onComplete) onComplete();
    } catch (err) {
      console.error("Error submitting signatures:", err);
      toast.error("Failed to submit signatures");
    } 
  };  

  const fetchSavedSignatures = useCallback(async () => {
    try {
      const res = await apiConnector("get", `http://localhost:5000/api/signatures/${pdfDoc._id}`, null, {
        withCredentials: true,
      });
      if (Array.isArray(res?.signatures)) {
        setSignatures(res.signatures.map(sig => ({ ...sig })));
      }
    } catch (err) {
      console.error("Error loading saved signatures", err);
    }
  }, [pdfDoc._id, signatureImage]);

  useEffect(() => {
    fetchSavedSignatureImage();
    fetchSavedSignatures();
  }, [fetchSavedSignatures]);

const handleExport = async () => {
  if (!signatures.length) return toast.error("No signatures placed to export");

  try {
    const response = await fetch(`${SERVER_BASE_URL}/${pdfDoc.filepath}`);
    if (!response.ok) throw new Error("Failed to fetch PDF");

    const existingPdfBytes = await response.arrayBuffer();
    const pdfDocInstance = await PDFDocument.load(existingPdfBytes);
    const pages = pdfDocInstance.getPages();

    // Get the viewer and page elements
    const container = containerRef.current;
    const viewerElement = container.querySelector('.rpv-core__inner-page');
    const pageElement = container.querySelector('.rpv-core__page-layer');
    
    if (!viewerElement || !pageElement) {
      throw new Error("Could not find PDF viewer elements");
    }

    const viewerRect = viewerElement.getBoundingClientRect();
    const pageRect = pageElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    // Calculate the scaling and offset factors
    const page = pages[currentPage - 1];
    const { width: pdfWidth, height: pdfHeight } = page.getSize();
    
    // The scale factor between PDF points and rendered pixels
    const scale = pdfWidth / pageRect.width;
    
    // The offset between container and actual page element
    const pageOffsetX = pageRect.left - containerRect.left;
    const pageOffsetY = pageRect.top - containerRect.top;

    // Viewer padding/margins (if any)
    const viewerPaddingX = (viewerRect.width - pageRect.width) / 2;
    const viewerPaddingY = (viewerRect.height - pageRect.height) / 2;

    for (const sig of signatures) {
      if (!sig.image) continue;

      // Convert screen coordinates to PDF coordinates
      const pdfX = (sig.x - pageOffsetX - viewerPaddingX) * scale;
      
      // PDF y=0 is at the bottom, so we invert the y-axis
      const pdfY = pdfHeight - (sig.y - pageOffsetY - viewerPaddingY) * scale - (sig.height * scale);

      const base64Data = sig.image.split(",")[1];
      const pngBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const pngImage = await pdfDocInstance.embedPng(pngBytes);

      page.drawImage(pngImage, {
        x: pdfX,
        y: pdfY,
        width: sig.width * scale,
        height: sig.height * scale,
      });

      console.log('Signature placed at:', {
        page: sig.page,
        original: { x: sig.x, y: sig.y },
        pdfCoords: { x: pdfX, y: pdfY },
        dimensions: { 
          original: { width: sig.width, height: sig.height },
          pdf: { width: sig.width * scale, height: sig.height * scale }
        },
        scaleFactor: scale
      });
    }

    const pdfBytes = await pdfDocInstance.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${pdfDoc.filename.replace('.pdf', '')}-signed.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    toast.success("PDF exported with signature ✅");
    if (isPublic && onComplete) onComplete();

  } catch (err) {
    console.error("Export failed:", err);
    toast.error("Failed to export PDF with signature");
  }
};

  return (
    <div className="p-4 space-y-4">
      <div className="sticky top-0 z-30 bg-white shadow flex flex-wrap gap-3 p-3 rounded-md border mb-4 justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {!isPublic && (
            <button onClick={goBack} className="px-3 py-1.5 bg-gray-300 text-sm rounded hover:bg-gray-400 flex items-center gap-2">
              <FaArrowLeft /> Back
            </button>
          )}
          {!isPublic && (
            <button onClick={() => setShowSavedModal(true)} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2">
              <FaUniversity /> Saved
            </button>
          )}
          <button onClick={() => setShowPad(true)} className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 flex items-center gap-2">
            <FaPenFancy /> Draw
          </button>
          <button onClick={() => setShowTextModal(true)} className="px-3 py-1.5 bg-pink-600 text-white text-sm rounded hover:bg-pink-700 flex items-center gap-2">
            <FaFont /> Type
          </button>
          <button onClick={() => setSignMode(prev => !prev)} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 flex items-center gap-2">
            {signMode ? <FaSign /> : <FaEye />} Mode
          </button>
        </div>
        <div className="flex items-center gap-2">
          {!isPublic && (
            <button onClick={handleSaveToServer} className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 flex items-center gap-2">
              <FaSave /> Saveee
            </button>
          )}
          <button onClick={handleExport} className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 flex items-center gap-2">
            <FaDownload /> Export
          </button>
          <button onClick={handleSubmit} className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 flex items-center gap-2">
            <FaDownload /> Submit
          </button>
        </div>
      </div>

      <div ref={containerRef} onClick={handlePlaceSignature} className="relative border bg-white shadow rounded-md p-2 flex justify-center min-h-[80vh]">
        <div className="relative border bg-white shadow rounded-md p-2 mx-auto" style={{ width: '90vw', maxWidth: '1000px' }}>
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <Viewer fileUrl={`http://localhost:5000/${pdfDoc.filepath}`} onPageChange={(e) => setCurrentPage(e.currentPage + 1)} />
        </Worker>
        </div>

        {signatures.map((sig, idx) => (
          sig.page === currentPage && (
            <Rnd
              key={idx}
              default={{ x: sig.x, y: sig.y, width: sig.width, height: sig.height }}
              bounds="parent"
              enableResizing={signMode}
              disableDragging={!signMode}
              resizeHandleClasses={{
                bottomRight: 'resize-handle'
              }}
              onDragStop={(e, d) => {
                const updated = [...signatures];
                updated[idx].x = d.x;
                updated[idx].y = d.y;
                setSignatures(updated);
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                const updated = [...signatures];
                updated[idx].width = parseInt(ref.style.width);
                updated[idx].height = parseInt(ref.style.height);
                updated[idx].x = position.x;
                updated[idx].y = position.y;
                setSignatures(updated);
              }}
            >
              <div className="relative">
                <img src={sig.image || signatureImage} alt="signature" className="w-full h-full" />
              </div>
            </Rnd>
          )
        ))}
      </div>

      {showSavedModal && (
        <SavedSignatureModal
          onClose={() => setShowSavedModal(false)}
          onSelect={(sig) => {
            setSignatureImage(sig);
            toast.success("Signature selected");
          }}
        />
      )}

      {showPad && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-200">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[420px] space-y-4">
            <h3 className="text-lg font-semibold text-center">Draw Your Signature</h3>
            <SignatureCanvas
              penColor="black"
              ref={sigPadRef}
              canvasProps={{ width: 400, height: 200, className: "rounded-md" }}
            />
            <div className="flex justify-between">
              <button onClick={() => sigPadRef.current.clear()} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-2"><FaTimes /> Clear</button>
              <button onClick={saveSignature} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"><FaSave /> Save</button>
              <button onClick={() => setShowPad(false)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"><FaTimes /> Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showTextModal && (
        <TextSignatureModal
          onClose={() => setShowTextModal(false)}
          onSelect={(image) => {
            setSignatureImage(image);
            toast.success("Typed signature selected");
            setShowTextModal(false);
          }}
        />
      )}
    </div>
  );
};

export default PDFEditor;
