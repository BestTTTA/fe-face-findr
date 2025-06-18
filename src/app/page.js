'use client';
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SearchPage() {
  const [searchFile, setSearchFile] = useState(null);
  const [searchMessage, setSearchMessage] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null); // New state for image preview
  const [hasConsent, setHasConsent] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null); // To store the camera stream

  const router = useRouter();

  // Function to close the camera and stop tracks
  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null; // Clear the stored stream
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  // Effect for cleanup: ensure camera is closed when component unmounts
  useEffect(() => {
    return () => {
      closeCamera();
      // Also clear preview image on unmount
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  // New useEffect to handle camera stream when isCameraOpen changes
  useEffect(() => {
    const initializeCameraStream = async () => {
      if (isCameraOpen) {
        setSearchFile(null); // Clear any selected file when camera opens
        setPreviewImage(null); // Clear preview when camera opens
        setSearchMessage(''); // Clear previous messages
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = stream; // Store the stream

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          } else {
            console.warn("videoRef.current was null even after setting isCameraOpen to true. Retrying or handling differently.");
            closeCamera();
            setSearchMessage('❌ เกิดข้อผิดพลาดในการเตรียมกล้อง');
          }
        } catch (err) {
          console.error('Error accessing camera:', err);
          setSearchMessage('❌ ไม่สามารถเข้าถึงกล้องได้: โปรดตรวจสอบการอนุญาตของเบราว์เซอร์หรือไม่มีกล้อง');
          closeCamera();
        }
      } else {
        // If isCameraOpen becomes false, ensure camera is closed
        closeCamera();
      }
    };

    initializeCameraStream();

    // Cleanup function for this specific effect
    return () => {
      const stream = streamRef.current;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
    };
  }, [isCameraOpen]);

  // Handle file selection from input
  const handleFileChange = (e) => {
    if (!hasConsent) {
      setSearchMessage('กรุณายอมรับเงื่อนไขการใช้งานก่อนดำเนินการต่อ');
      return;
    }
    const file = e.target.files?.[0] || null;
    setSearchFile(file);
    setSearchMessage('');
    if (isCameraOpen) closeCamera(); // Close camera if a file is selected

    if (file) {
      // Create a URL for the selected file to display it
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
    } else {
      setPreviewImage(null);
    }
  };

  // Function to capture photo from camera
  const capturePhoto = () => {
    if (!hasConsent) {
      setSearchMessage('กรุณายอมรับเงื่อนไขการใช้งานก่อนดำเนินการต่อ');
      return;
    }
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "camera_capture.png", { type: "image/png" });
          setSearchFile(file);
          closeCamera(); // Close camera after capturing photo
          setSearchMessage('✅ ถ่ายภาพจากกล้องสำเร็จ!');

          // Create a URL for the captured image
          const objectUrl = URL.createObjectURL(file);
          setPreviewImage(objectUrl);
        } else {
          setSearchMessage('❌ ไม่สามารถจับภาพจากกล้องได้');
        }
      }, 'image/png');
    } else {
      setSearchMessage('❌ กล้องไม่พร้อมสำหรับการจับภาพ');
    }
  };

  const handleSearchImage = async () => {
    if (!hasConsent) {
      setSearchMessage('กรุณายอมรับเงื่อนไขการใช้งานก่อนดำเนินการต่อ');
      return;
    }
    if (!searchFile) {
      setSearchMessage('โปรดเลือกรูปภาพหรือถ่ายภาพจากกล้องเพื่อค้นหา');
      return;
    }

    const formData = new FormData();
    formData.append('file', searchFile);

    setIsSearching(true);
    setSearchMessage('กำลังค้นหาใบหน้าที่คล้ายกัน...');

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_API}/search-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        // Store results in localStorage instead of URL
        localStorage.setItem('searchResults', JSON.stringify(response.data.results));
        router.push('/results');
      } else {
        setSearchMessage(`❌ ข้อผิดพลาด: ${response.data.message || 'เกิดข้อผิดพลาดที่ไม่รู้จักระหว่างการค้นหา'}`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchMessage(`❌ ไม่สามารถค้นหารูปภาพได้: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-heading font-bold mb-6 text-center text-secondary-dark">🔍 ค้นหาใบหน้าที่คล้ายกัน</h1>
      <p className="text-gray-700 mb-6 text-center text-sm">อัปโหลดรูปภาพจากไฟล์ หรือถ่ายภาพจากกล้องเพื่อค้นหาใบหน้าที่คล้ายกันในฐานข้อมูล FaceFindr</p>

      {/* Consent Checkbox */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="consent"
              type="checkbox"
              checked={hasConsent}
              onChange={(e) => setHasConsent(e.target.checked)}
              className="w-4 h-4 text-primary-dark bg-gray-100 border-gray-300 rounded focus:ring-primary-dark"
            />
          </div>
          <label htmlFor="consent" className="ml-2 text-sm text-gray-700">
            <div className="font-semibold mb-2">ข้อตกลงและเงื่อนไขการใช้ระบบจดจำใบหน้า</div>
            
            <div className="mb-3">
              <div className="font-medium text-gray-800 mb-1">ข้อควรระวังในการใช้ระบบจดจำใบหน้า:</div>
              <ul className="list-disc ml-6 text-gray-600 space-y-1">
                <li>ห้ามอัปโหลดรูปภาพใบหน้าของผู้อื่นโดยไม่ได้รับอนุญาต หากจำเป็นต้องได้รับความยินยอมจากบุคคลนั้น (หรือผู้ปกครอง) สำหรับการใช้ข้อมูลใบหน้าของพวกเขา</li>
                <li>ห้ามแก้ไข แพร่กระจาย หรือดำเนินการอื่นๆ ที่ผิดกฎหมาย ไม่มีจริยธรรม หรือไม่เหมาะสมกับรูปภาพที่พบ</li>
              </ul>
            </div>

            <div className="mb-3">
              <div className="font-medium text-gray-800 mb-1">กฎการประมวลผลข้อมูลใบหน้า:</div>
              <ul className="list-disc ml-6 text-gray-600 space-y-1">
                <li>ข้อมูลใบหน้าเป็นข้อมูลส่วนบุคคลที่สำคัญ การปฏิเสธการให้ข้อมูลใบหน้าจะไม่ส่งผลกระทบต่อการใช้งานปกติของระบบ</li>
                <li>การค้นหาด้วยใบหน้าจะแสดงผลเฉพาะกับผู้ค้นหาเท่านั้น</li>
                <li>ระบบจะไม่เก็บรวบรวม เก็บรักษา ใช้ ประมวลผล ส่งต่อ ให้ หรือเปิดเผยข้อมูลใบหน้าโดยพลการ ยกเว้นเพื่อการค้นหารูปภาพอย่างรวดเร็ว</li>
              </ul>
            </div>

            <div className="mb-3">
              <div className="font-medium text-gray-800 mb-1">ข้อจำกัดความรับผิดชอบ:</div>
              <ul className="list-disc ml-6 text-gray-600 space-y-1">
                <li>ข้อมูลใบหน้าเป็นข้อมูลส่วนบุคคลที่สำคัญ การใช้ข้อมูลใบหน้าของผู้อื่นควรได้รับอนุญาตจากเจ้าของสิทธิ์</li>
                <li>ผู้ใช้ควรใช้ข้อมูลใบหน้าอย่างระมัดระวังและหลีกเลี่ยงการละเมิดสิทธิ์ที่ชอบด้วยกฎหมายของผู้อื่น</li>
                <li>หากมีข้อโต้แย้งเกี่ยวกับข้อกำหนดข้างต้น คุณสามารถขอให้หยุดใช้ฟังก์ชันการจดจำใบหน้าที่เกี่ยวข้องกับข้อมูลส่วนบุคคลของคุณได้ทันที</li>
              </ul>
            </div>

            <div className="text-gray-600 italic mt-2">
              โดยการคลิกที่ช่องทำเครื่องหมายนี้ คุณยืนยันว่าคุณได้อ่านและยอมรับข้อกำหนดและเงื่อนไขทั้งหมดข้างต้น
            </div>
          </label>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="mb-6 border-b pb-6 border-gray-200">
        <label htmlFor="search-file" className="block text-gray-700 text-sm font-bold mb-2">
          เลือกรูปภาพจากไฟล์
        </label>
        <input
          id="search-file"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleFileChange} // Use the new handler
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:hover:bg-primary-dark file:text-white cursor-pointer"
        />
      </div>

      {/* Camera Section */}
      <div className="mb-6">
        <h2 className="text-xl font-heading font-bold mb-4 text-center text-primary-dark">📸 หรือถ่ายภาพจากกล้อง</h2>
        {!isCameraOpen ? (
          <button
            onClick={() => {
              setIsCameraOpen(true); // Set state to true to render the video element, useEffect will handle stream
            }}
            className={`w-full hover:bg-accent-dark md:bg-gray-400 bg-accent-dark text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-lg shadow-md font-heading`}
          >
            เปิดกล้อง
          </button>
        ) : (
          <div className="flex flex-col items-center">
            <video
              ref={videoRef}
              className="w-full max-w-sm rounded-lg shadow-md mb-4"
              autoPlay
              playsInline
              muted
            >
            </video>
            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
            <div className="flex space-x-4">
              <button
                onClick={capturePhoto}
                className="flex-1 bg-secondary-DEFAULT hover:bg-secondary-dark bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md"
              >
                ถ่าย
              </button>
              <button
                onClick={closeCamera}
                className="flex-1 bg-danger-DEFAULT hover:bg-red-600 bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md"
              >
                ปิด
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Section */}
      {previewImage && (
        <div className="mb-6 text-center">
          <h2 className="text-xl font-heading font-bold mb-4 text-primary-dark">ภาพที่เลือก/ถ่าย</h2>
          <img src={previewImage} alt="Preview" className="max-w-full h-auto mx-auto rounded-lg shadow-md border border-gray-300" />
        </div>
      )}

      {/* Search Button */}
      <button
        onClick={handleSearchImage}
        className={`w-full text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-lg shadow-md font-heading
          md:bg-gray-400 hover:bg-primary-dark bg-primary-dark`}
      >
        {isSearching ? 'กำลังค้นหา...' : 'ค้นหาใบหน้า'}
      </button>

      {searchMessage && (
        <p className={`mt-4 text-md font-medium text-center ${searchMessage.startsWith('❌') ? 'text-danger-DEFAULT' : 'text-secondary-dark'}`}>
          {searchMessage}
        </p>
      )}
    </div>
  );
}