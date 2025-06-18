'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HARDCODED_PASSWORD = process.env.NEXT_PUBLIC_HARDCODED_PASSWORD

export default function UploadPage() {
  const [uploadFilesToDb, setUploadFilesToDb] = useState([]);
  const [uploadDbMessage, setUploadDbMessage] = useState('');
  const [isUploadingToDb, setIsUploadingToDb] = useState(false);
  const [dbStats, setDbStats] = useState(null);
  const MAX_FILES = 1000; // Maximum number of files allowed
  const [uploadProgress, setUploadProgress] = useState({});
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [showProgressDetails, setShowProgressDetails] = useState(true);

  // State for password protection
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(true); // Modal is open by default
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fetchDbStats = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_BASE_API}/stats`);
      setDbStats(response.data);
    } catch (error) {
      console.error('Error fetching database stats:', error);
      // Optionally, set an error message for stats fetching
    }
  };

  useEffect(() => {
    // Fetch stats only if password is confirmed
    if (!isPasswordModalOpen) {
      fetchDbStats();
    }
  }, [isPasswordModalOpen]); // Depend on isPasswordModalOpen

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === HARDCODED_PASSWORD) {
      setIsPasswordModalOpen(false); // Close modal
      setPasswordError(''); // Clear any previous error
    } else {
      setPasswordError('รหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง');
    }
  };

  const handleUploadToDatabase = async () => {
    if (uploadFilesToDb.length === 0) {
      setUploadDbMessage('โปรดเลือกรูปภาพอย่างน้อยหนึ่งไฟล์เพื่ออัปโหลดเข้าสู่ฐานข้อมูล');
      return;
    }

    setIsUploadingToDb(true);
    setUploadDbMessage(`กำลังอัปโหลด ${uploadFilesToDb.length} รูปภาพเข้าสู่ฐานข้อมูล...`);

    let successfulUploads = 0;
    let failedUploads = 0;

    const uploadPromises = uploadFilesToDb.map(async (file, index) => {
      const formData = new FormData();
      formData.append('file', file);

      try {
        setCurrentFileIndex(index);
        const response = await axios.post(`${process.env.NEXT_PUBLIC_BASE_API}/upload-to-db`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: percentCompleted
            }));
          },
        });

        if (response.data.status === 'success') {
          successfulUploads++;
          return { status: 'fulfilled', filename: file.name, message: response.data.message };
        } else {
          failedUploads++;
          return { status: 'rejected', filename: file.name, message: response.data.message || 'เกิดข้อผิดพลาดที่ไม่รู้จัก' };
        }
      } catch (err) {
        failedUploads++;
        return { status: 'rejected', filename: file.name, message: err.response?.data?.detail || err.message };
      }
    });

    const results = await Promise.allSettled(uploadPromises);

    setIsUploadingToDb(false);
    setUploadFilesToDb([]); // Clear selected files after attempt

    if (successfulUploads > 0 && failedUploads === 0) {
      setUploadDbMessage(`✅ อัปโหลดรูปภาพทั้งหมด ${successfulUploads} รูปเข้าสู่ฐานข้อมูลสำเร็จ!`);
    } else if (successfulUploads > 0 && failedUploads > 0) {
      setUploadDbMessage(`⚠️ อัปโหลด ${successfulUploads} รูปสำเร็จ แต่ ${failedUploads} รูปไม่สำเร็จ ตรวจสอบ Console สำหรับรายละเอียด`);
      results.forEach(res => {
        if (res.status === 'rejected') {
          console.error(`Failed to upload ${res.value.filename}: ${res.value.message}`);
        }
      });
    } else {
      setUploadDbMessage(`❌ ไม่สามารถอัปโหลดรูปภาพได้เลย ${failedUploads} ข้อผิดพลาด`);
      results.forEach(res => {
        if (res.status === 'rejected') {
          console.error(`Failed to upload ${res.value.filename}: ${res.value.message}`);
        }
      });
    }
    fetchDbStats(); // Refresh stats after all uploads
  };

  // Render password modal if not authenticated
  if (isPasswordModalOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl max-w-sm w-full mx-4">
          <h2 className="text-2xl font-bold text-center text-primary-dark mb-6">🔒 ต้องระบุรหัสผ่าน</h2>
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                รหัสผ่าน:
              </label>
              <input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError(''); // Clear error on new input
                }}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="ป้อนรหัสผ่าน"
                required
              />
            </div>
            {passwordError && (
              <p className="text-danger-DEFAULT text-sm text-center mb-4">{passwordError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-primary-dark hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md"
            >
              เข้าสู่ระบบ
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render the main upload page content after successful authentication
  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-heading font-bold mb-6 text-center text-primary-dark">📤 อัปโหลดรูปภาพเข้าฐานข้อมูล</h1>
      <p className="text-gray-700 mb-6 text-center">เลือกรูปภาพ **หลายรูป** เพื่อเพิ่มใบหน้าลงในฐานข้อมูล FaceFindr เพื่อใช้ในการค้นหาในอนาคต</p>

      <div className="mb-6">
        <label htmlFor="upload-files" className="block text-gray-700 text-sm font-bold mb-2">
          เลือกรูปภาพสำหรับอัปโหลด
        </label>
        <input
          id="upload-files"
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length > MAX_FILES) {
              setUploadDbMessage(`❌ จำนวนไฟล์เกินกว่าที่กำหนด (สูงสุด ${MAX_FILES} ไฟล์)`);
              setUploadFilesToDb([]);
              e.target.value = ''; // Clear the input
            } else {
              setUploadFilesToDb(files);
              setUploadDbMessage(''); // Clear message when new files are selected
            }
          }}
          className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-secondary-light file:text-white hover:file:bg-secondary-DEFAULT cursor-pointer transition-colors duration-200"
        />
        {uploadFilesToDb.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            เลือก: **{uploadFilesToDb.length}** ไฟล์
          </p>
        )}
      </div>

      <button
        onClick={handleUploadToDatabase}
        disabled={uploadFilesToDb.length === 0 || isUploadingToDb}
        className="w-full bg-primary-dark hover:bg-primary-light disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 text-lg shadow-md font-heading"
      >
        {isUploadingToDb ? 'กำลังอัปโหลด...' : `อัปโหลด ${uploadFilesToDb.length > 0 ? uploadFilesToDb.length : ''} รูปเข้าฐานข้อมูล`}
      </button>

      {uploadDbMessage && (
        <p className={`mt-4 text-md font-medium text-center ${uploadDbMessage.startsWith('❌') ? 'text-danger-DEFAULT' : (uploadDbMessage.startsWith('⚠️') ? 'text-accent-dark' : 'text-secondary-dark')}`}>
          {uploadDbMessage}
        </p>
      )}

      {isUploadingToDb && uploadFilesToDb.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-gray-600">
              กำลังอัปโหลดไฟล์ {currentFileIndex + 1} จาก {uploadFilesToDb.length}
            </p>
            <button
              onClick={() => setShowProgressDetails(!showProgressDetails)}
              className="text-sm text-primary-dark hover:text-primary-light transition-colors"
            >
              {showProgressDetails ? 'ซ่อนรายละเอียด' : 'แสดงรายละเอียด'}
            </button>
          </div>
          {showProgressDetails && Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="w-full">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span className="truncate max-w-[60%]">{filename}</span>
                <div className="flex items-center gap-2">
                  <span>{progress}%</span>
                  <span className="text-gray-500 whitespace-nowrap">{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-dark h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {dbStats && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center shadow-inner">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">📊 สถิติฐานข้อมูล</h3>
          <p className="text-gray-600">จำนวนใบหน้าในฐานข้อมูล: **{dbStats.total_faces}**</p>
          <p className="text-gray-600">จำนวนรูปภาพในฐานข้อมูล: **{dbStats.total_images}**</p>
        </div>
      )}
    </div>
  );
}