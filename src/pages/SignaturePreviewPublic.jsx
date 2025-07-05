import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { FaArrowLeft, FaTimes } from "react-icons/fa";
import { Rnd } from "react-rnd";

const SignaturePreviewPublic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const containerRef = useRef(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [viewerSize, setViewerSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Extract signature data from navigation state
  const { x, y, width, height, page, image } = location.state?.signature || {};
  const { document } = location.state || {};
    
  useEffect(() => {
    if (!location.state?.signature || !location.state?.document) {
      navigate("/dashboard");
    }
  }, [location.state, navigate]);

  const handlePageChange = (e) => {
    setCurrentPage(e.currentPage + 1);
    // Delay measurement to allow page to render
    setTimeout(measureElements, 100);
  };

  const measureElements = () => {
    const container = containerRef.current;
    if (!container) return;

    // Measure the container
    const containerRect = container.getBoundingClientRect();
    setContainerSize({
      width: containerRect.width,
      height: containerRect.height
    });

    // Measure the viewer element
    const viewerElement = container.querySelector('.rpv-core__viewer');
    if (viewerElement) {
      const viewerRect = viewerElement.getBoundingClientRect();
      setViewerSize({
        width: viewerRect.width,
        height: viewerRect.height
      });
    }

    // Measure the page element
    const pageElement = container.querySelector('.rpv-core__page-layer');
    if (pageElement) {
      const pageRect = pageElement.getBoundingClientRect();
      setPageSize({
        width: pageRect.width,
        height: pageRect.height,
        left: pageRect.left - containerRect.left,
        top: pageRect.top - containerRect.top
      });
    }
  };

  useEffect(() => {
    const resizeObserver = new ResizeObserver(measureElements);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  const calculateScaledPosition = () => {
    if (!pageSize.width || !viewerSize.width) return null;

    // Calculate scale factors
    const scaleX = pageSize.width / viewerSize.width;
    const scaleY = pageSize.height / viewerSize.height;

    return {
      x: x * scaleX + pageSize.left,
      y: y * scaleY + pageSize.top,
      width: width * scaleX,
      height: height * scaleY
    };
  };

  const scaledPosition = calculateScaledPosition();

  if (!location.state?.signature || !location.state?.document) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading signature preview...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-auto p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Signature Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-2"
            >
              <FaArrowLeft /> Back
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center gap-2"
            >
              <FaTimes /> Close
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden relative p-4">
          <div 
            ref={containerRef} 
            className="relative border bg-white shadow rounded-md p-2 mx-auto" 
            style={{ 
              width: '90%', 
              height: '90%',
              maxWidth: '1000px'
            }}
          >
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
              <Viewer 
                fileUrl={`http://localhost:5000/${document.filepath}`}
                onPageChange={handlePageChange}
                onDocumentLoad={measureElements}
              />
            </Worker>

            {/* Signature Overlay - Only shows on correct page */}
            {page === currentPage && image && scaledPosition && (
              <Rnd
                position={{ x: scaledPosition.x, y: scaledPosition.y }}
                size={{ width: scaledPosition.width, height: scaledPosition.height }}
                disableDragging={true}
                enableResizing={false}
                bounds="parent"
              >
                <div className="relative w-full h-full">
                  <img 
                    src={image} 
                    alt="Signature Preview" 
                    className="w-full h-full object-contain border-2 border-blue-500 bg-white bg-opacity-50"
                  />
                </div>
              </Rnd>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="text-center text-sm text-gray-600">
            <p>Document: {document.filename}</p>
            <p>Signature on page {page} | Current page: {currentPage}</p>
            <p>Original Position: X: {x}px, Y: {y}px | Size: {width}×{height}px</p>
            {scaledPosition && (
              <p>Rendered Position: X: {scaledPosition.x.toFixed(1)}px, Y: {scaledPosition.y.toFixed(1)}px | 
              Size: {scaledPosition.width.toFixed(1)}×{scaledPosition.height.toFixed(1)}px</p>
            )}
            <p>Page Size: {pageSize.width.toFixed(1)}×{pageSize.height.toFixed(1)}</p>
            <p>Viewer Size: {viewerSize.width.toFixed(1)}×{viewerSize.height.toFixed(1)}</p>
            <p>Container Size: {containerSize.width.toFixed(1)}×{containerSize.height.toFixed(1)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignaturePreviewPublic;