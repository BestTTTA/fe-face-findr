'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

const BASE_IMAGE_URL = process.env.NEXT_PUBLIC_BASE_API;

const ImagePreviewModal = ({ isOpen, onClose, imageUrls, currentIndex, onNavigate, onDownload }) => {
  if (!isOpen || !imageUrls || imageUrls.length === 0) return null;

  const currentImageUrl = imageUrls?.[currentIndex]?.image_url;

  const handlePrev = () => {
    onNavigate(currentIndex - 1);
  };

  const handleNext = () => {
    onNavigate(currentIndex + 1);
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-opacity-80 z-50 flex justify-center items-center">
      <div className="bg-white bg-opacity-80 rounded-lg p-8 w-full max-h-[90vh] overflow-auto relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 text-xl">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {currentImageUrl ? (
          <div className="relative w-full h-[60vh]">
            <Image
              src={currentImageUrl}
              alt="Preview"
              fill
              className="object-contain rounded-lg shadow-md mb-4"
            />
          </div>
        ) : (
          <div className="text-center text-gray-500 py-20">ไม่พบรูปภาพ</div>
        )}
        <div className="flex justify-between items-center mt-4">
          <button onClick={handlePrev} disabled={currentIndex === 0} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded disabled:opacity-50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            ก่อนหน้า
          </button>
          <button
            onClick={() => onDownload(currentImageUrl)}
            disabled={!currentImageUrl}
            className=" hover:bg-primary-dark bg-primary-light text-white font-semibold py-2 px-4 rounded shadow-md disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block mr-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l3 4.5m-3 0v13.5" />
            </svg>
            ดาวน์โหลด
          </button>
          <button onClick={handleNext} disabled={currentIndex === (imageUrls?.length || 0) - 1} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded disabled:opacity-50">
            ถัดไป
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 inline-block ml-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

function ResultsContent() {
  const searchParams = useSearchParams();
  const [searchProcessedResults, setSearchProcessedResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  useEffect(() => {
    try {
      // Try to get results from localStorage first
      const storedResults = localStorage.getItem('searchResults');
      if (storedResults) {
        setSearchProcessedResults(JSON.parse(storedResults));
        // Clear the stored results after retrieving them
        localStorage.removeItem('searchResults');
        return;
      }

      // Fallback to URL parameters if no stored results
      const resultsData = searchParams.get('data');
      if (resultsData) {
        const parsedResults = JSON.parse(decodeURIComponent(resultsData));
        setSearchProcessedResults(parsedResults);
      } else {
        setErrorMessage('ไม่มีข้อมูลผลลัพธ์การค้นหา');
      }
    } catch (error) {
      console.error('Failed to parse search results:', error);
      setErrorMessage('ไม่สามารถโหลดผลลัพธ์การค้นหาได้ กรุณาลองใหม่อีกครั้ง');
    }
  }, [searchParams]);

  const handleImageClick = (index) => {
    setPreviewIndex(index);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
  };

  const handleNavigatePreview = (newIndex) => {
    if (
      searchProcessedResults?.matches?.partial_matches &&
      newIndex >= 0 &&
      newIndex < searchProcessedResults.matches.partial_matches.length
    ) {
      setPreviewIndex(newIndex);
    }
  };

  const downloadImage = async (imageUrl) => {
    if (imageUrl) {
      try {
        // Fetch the image
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        
        // Create a blob URL
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create and trigger download link
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = imageUrl.split('/').pop();
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error('Error downloading image:', error);
      }
    }
  };

  const downloadAllImages = () => {
    if (searchProcessedResults?.matches?.partial_matches) {
      setIsDownloadingAll(true);
      searchProcessedResults.matches.partial_matches.forEach((match, index) => {
        setTimeout(() => {
          downloadImage(match.image_url);
          if (index === searchProcessedResults.matches.partial_matches.length - 1) {
            setIsDownloadingAll(false);
          }
        }, index * 500); 
      });
    }
  };

  const renderMatchGroup = (title, matches, colorClass) => {
    if (!matches || matches.length === 0) return null;

    return (
      <div className="mb-8">
        {title && <h2 className={`text-xl font-semibold mb-4 ${colorClass}`}>{title}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((res, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 shadow-md bg-white flex flex-col items-center text-center cursor-pointer" onClick={() => handleImageClick(i)}>
              {res.image_url && (
                <div className="relative w-full h-48">
                  <Image
                    src={res.image_url}
                    alt={`Match ${i + 1}`}
                    fill
                    className="object-cover rounded-lg mb-3 shadow-sm"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (errorMessage) {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg text-center text-danger-DEFAULT font-bold">
        {errorMessage}
      </div>
    );
  }

  if (!searchProcessedResults) {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg text-center text-gray-600">
        กำลังโหลดผลลัพธ์การค้นหา...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-heading font-bold mb-8 text-center text-secondary-dark">📊 ผลลัพธ์การค้นหาใบหน้า</h1>

      <div className="mb-8 text-center text-lg font-semibold">
        <p className="text-orange-800">ค้นพบใบหน้า: {searchProcessedResults.statistics.partial_matches} รายการ</p>
      </div>

      {renderMatchGroup("", searchProcessedResults.matches.partial_matches, "text-orange-800")}

      {searchProcessedResults.matches.partial_matches?.length > 0 && (
        <div className="text-center mt-8">
          <button
            onClick={downloadAllImages}
            className="hover:bg-primary-light bg-primary-dark text-white font-semibold py-3 px-6 rounded-full shadow-md disabled:opacity-50"
          >
            {isDownloadingAll ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังดาวน์โหลด...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 inline-block mr-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l3 4.5m-3 0v13.5" />
                </svg>
                ดาวน์โหลดทั้งหมด
              </>
            )}
          </button>
        </div>
      )}

      {searchProcessedResults.statistics.total_matches === 0 && (
        <div className="mt-6 p-4 bg-accent-light rounded-lg text-center text-accent-dark font-medium">
          ไม่พบใบหน้าที่คล้ายกันสำหรับรูปภาพที่ค้นหา ลองอัปโหลดรูปภาพเข้าฐานข้อมูลเพิ่มเติมก่อน.
        </div>
      )}

      <ImagePreviewModal
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        imageUrls={searchProcessedResults?.matches?.partial_matches}
        currentIndex={previewIndex}
        onNavigate={handleNavigatePreview}
        onDownload={downloadImage}
      />
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg text-center text-gray-600">
        กำลังโหลดผลลัพธ์การค้นหา...
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}