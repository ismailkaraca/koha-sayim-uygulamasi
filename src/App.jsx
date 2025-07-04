import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import * as Tone from 'tone';

// --- Custom Hooks & Libraries ---
const useScript = (url, globalVarName) => {
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (window[globalVarName]) {
      setIsReady(true);
      return;
    }
    let script = document.querySelector(`script[src="${url}"]`);
    const handleLoad = () => setIsReady(true);
    const handleError = () => console.error(`Error loading script: ${url}`);

    if (!script) {
      script = document.createElement('script');
      script.src = url;
      script.async = true;
      document.body.appendChild(script);
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
    } else {
        script.addEventListener('load', handleLoad);
        script.addEventListener('error', handleError);
    }
    return () => { if (script && script.parentElement) { script.removeEventListener('load', handleLoad); script.removeEventListener('error', handleError); } };
  }, [url, globalVarName]);
  return isReady;
};

// --- Data Constants & Icons ---
const INITIAL_LIBRARIES = { "12":"ADANA İL HALK KÜTÜPHANESİ","1530":"Adana Adalet Halk Kütüphanesi","1317":"Adana Aladağ İlçe Halk Kütüphanesi","113":"Adana Ceyhan İlçe Halk Kütüphanesi","1310":"Adana Ceyhan Murat Göğebakan Kültür Merkezi Halk Kütüphanesi","670":"Adana Feke İlçe Halk Kütüphanesi","760":"Adana İmamoğlu Remzi Oğuz Arık İlçe Halk Kütüphanesi","1200":"Adana Karacaoğlan Edebiyat Müze Kütüphanesi","796":"Adana Karaisalı İlçe Halk Kütüphanesi","675":"Adana Kozan Gazi Halk Kütüphanesi","114":"Adana Kozan Karacaoğlan İlçe Halk Kütüphanesi","1320":"Adana Kozan Özden Kültür Merkezi Halk Kütüphanesi","956":"Adana Pozantı İlçe Halk Kütüphanesi","499":"Adana Saimbeyli Azmi Yazıcıoğlu İlçe Halk Kütüphanesi","1588":"Adana Sarıçam Bebek ve Çocuk Kütüphanesi","1007":"Adana Sarıçam İlçe Halk Kütüphanesi","763":"Adana Sarıçam İncirlik 100. Yıl Çocuk Kütüphanesi","557":"Adana Seyhan Çağdaş Çocuk Kütüphanesi","1024":"Adana Seyhan Şakirpaşa Halk Kütüphanesi","995":"Adana Seyhan Yusuf Fırat Kotan İlçe Halk Kütüphanesi","1071":"Adana Tufanbeyli İlçe Halk Kütüphanesi","1135":"Adana Yumurtalık İlçe Halk Kütüphanesi","1139":"Adana Yüreğir Hacı Mehmet Sabancı İlçe Halk Kütüphanesi","1237":"Adana Yüreğir Kültür Merkezi Çocuk ve Gençlik Kütüphanesi","13":"ADIYAMAN İL HALK KÜTÜPHANESİ", "110": "DEMO EĞİTİM KÜTÜPHANESİ"};
const INITIAL_LOCATIONS = {"AB":"Atatürk Bölümü","AÖÖK":"Adnan Ötüken Özel Koleksiyonu (Adnan Ötüken İl Halk İçin)","Bakanlık Yayınları":"Bakanlık Yayınları (Edebiyat Müze Kütüphaneleri İçin)","BB":"Bebek Bölümü (0-3 Yaş)","BEYRA":"Rami Yerleşkesi","D":"Depo","DB":"Danışma Bölümü","DG":"Diğer","Edebiyat Kuramı":"Edebiyat Kuramı (Edebiyat Müze Kütüphaneleri İçin)","EK":"Etkinlik Kitapları Bölümü","GAY":"Gezici Kütüphane Anadolu Yakası","GB":"Gençlik Bölümü","GD1":"Geçici Derme1","GD2":"Geçici Derme2","GD3":"Geçici Derme3","GD4":"Geçici Derme4 (Kurumlar)","Gİ":"Gör-İşit Bölümü","GK":"Gezici Kütüphane","GK2":"Gezici Kütüphane 2","IOK":"İlk Okuma Kitapları Bölümü","İmzalı Kitaplar":"İmzalı Kitaplar (Edebiyat Müze Kütüphaneleri İçin)","KB":"Kataloglama Bölümü","KK":"Kent Kitaplığı","KOK":"Osmaniye Fakıuşağı Konteyner Kent","NE":"Nadir Eserler Bölümü","NÖ":"Nobel Ödüllü Kitaplar","OÖ":"Okul Öncesi Bölümü","RA1":"Atatürk İhtisas (Rami Kütüphanesi)","RA10":"Toplum Bilimleri: 142 (Rami Kütüphanesi)","RA11":"Dil ve Dil Bilimi: 163 (Rami Kütüphanesi)","RA12":"Doğa Bilimleri ve Matematik: 141 (Rami Kütüphanesi)","RA13":"Teknoloji ve Uygulamalı Bilimler: 150 (Rami Kütüphanesi)","RA14":"Güzel Sanatlar: 153 (Rami Kütüphanesi)","RA15":"Edebiyat & Retorik: 154/155 (Rami Kütüphanesi)","RA16":"Tarih & Coğrafya: 168 (Rami Kütüphanesi)","RA18":"İlk Öğretim Çalışma Salonu (10-14 yaş): 125 (Rami Kütüphanesi)","RA19":"Atatürk İhtisas: 114 (Rami Kütüphanesi)","RA2":"İlk Öğretim Çalışma Salonu (6-9 yaş): 124 (Rami Kütüphanesi)","RA20":"Atatürk İhtisas: 115 (Rami Kütüphanesi)","RA21":"Biyografi Kitaplığı: 118 (Rami Kütüphanesi)","RA22":"Günay-Turgut Kut İhtisas Kitaplığı (Yazma Eserler Okuma Salonu): 177 (Rami Kütüphanesi)","RA23":"Engelsiz Bilgi Merkezi: 148 (Rami Kütüphanesi)","RA3":"Bebek Kütüphanesi (Masal 0-3 yaş): 126/127 (Rami Kütüphanesi)","RA4":"Lise Hazırlık: 129/130 (Rami Kütüphanesi)","RA5":"Üniversite Hazırlık: 134 (Rami Kütüphanesi)","RA7":"Genel Konular: 156 (Rami Kütüphanesi)","RA8":"Psikoloji ve Felsefe: 139 (Rami Kütüphanesi)","RA9":"Din: 146 (Rami Kütüphanesi)","S":"Salon","SAM":"Şehir Araştırmaları Merkezi","SB":"Sanat Bölümü","SY":"Süreli Yayınlar Bölümü","TEDA Kitapları":"TEDA Kitapları","Türk Edebiyatı":"Türk Edebiyatı (Edebiyat Müze Kütüphaneleri İçin)","YB":"Yetişkin Bölümü","YC":"Yetişkin Cep (Adnan Ötüken İl Halk İçin)","YDB":"Yabancı Diller Bölümü","ZBB":"Ziya Bey Bölümü","ÇB":"Çocuk Bölümü","Ödüllü Kitaplar - Dünya Edebiyatı":"Ödüllü Kitaplar - Dünya Edebiyatı (Edebiyat Müze Kütüphaneleri İçin)","Ödüllü Kitaplar - Türk Edebiyatı":"Ödüllü Kitaplar - Türk Edebiyatı (Edebiyat Müze Kütüphaneleri İçin)","ÖK":"Özel Koleksiyon"};
const WARNING_DEFINITIONS = { invalidStructure: { id: 'invalidStructure', text: 'Yapıya Uygun Olmayan', color: '#E74C3C', sound: 'A#3', message: 'Barkod Yapısına uygun olmayan barkod okundu.' }, locationMismatch: { id: 'locationMismatch', text: 'Konum Farklı', color: '#FAD7A0', sound: 'C4', message: 'Okutulan materyal seçilen lokasyonda bulunmuyor.' }, notLoanable: { id: 'notLoanable', text: 'Ödünç Verilemez', color: '#F08080', sound: 'E5', message: 'Materyalin ödünç verilebilirlik durumu uygun değil.' }, notInCollection: { id: 'notInCollection', text: 'Düşüm/Devir', color: '#A9C9F5', sound: 'G4', message: 'Materyal koleksiyonda değil (düşüm veya devir yapılmış).' }, complaintKHK: { id: 'complaintKHK', text: 'Şikayet/KHK', color: '#B39EB5', sound: 'E5', message: 'Bu materyal üzerinde şikayet veya KHK bildirimi var.' }, onLoan: { id: 'onLoan', text: 'Okuyucuda', color: '#F7B38D', sound: 'C4', message: 'Materyal şu anda ödünçte ve iade edilmesi gerekiyor.' }, wrongLibrary: { id: 'wrongLibrary', text: 'Farklı Kütüphane', color: '#C7AED9', sound: 'C4', message: 'Materyal sizin kütüphanenize ait değil.' }, deleted: { id: 'deleted', text: 'Listede Yok', color: '#808080', sound: 'A3', message: 'Barkod formatı doğru ancak içeri aktarılan listede bulunamadı.' }, autoCompletedNotFound: { id: 'autoCompletedNotFound', text: 'Manuel Girilen Ancak Listede Olmayan Barkodlar', color: '#8E44AD', sound: 'A3', message: 'Barkod 12 Haneli Olacak Şekilde Tamamlanmış Ancak İçeri Aktardığınız Materyal Listesinde Bulunmamaktadır. Materyal Barkodunu Kontrol Ediniz.' }, duplicate: { id: 'duplicate', text: 'Tekrar Okutuldu', color: '#FFC300', sound: 'B4', message: 'Bu barkod daha önce okutuldu.'} };
const PIE_CHART_COLORS = { valid: '#2ECC71', invalid: '#E74C3C', missing: '#95A5A6' };
const ICONS = {
    download: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    writeOff: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9.5 14.5 5-5"/><path d="m14.5 14.5-5-5"/></svg>,
    missing: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>,
    all: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
    clean: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    wrongLib: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41c.39.39.59.9.59 1.41v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h7.59c.51 0 1.02.2 1.41.59l4.59 4.59c.39.39.59.9.59 1.41z"/><path d="M12 3v10l-4-2-4 2V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/></svg>,
    location: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
    notLoanable: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    status: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.6v-2.1c0-2.8 2.2-5 5-5h11"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 11.4v2.1c0 2.8-2.2 5-5 5H5"/></svg>,
    complaint: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
    onLoan: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><circle cx="12" cy="8" r="2"/><path d="M15 13a3 3 0 1 0-6 0"/></svg>,
};

// --- Utilities & Components ---
const synth = new Tone.Synth().toDestination();
const playSound = (note) => { try { if (Tone.context.state !== 'running') { Tone.context.resume(); } synth.triggerAttackRelease(note, "8n"); } catch (e) { console.error("Ses çalınamadı:", e); } };
const playMultipleWarningSound = () => { try { if (Tone.context.state !== 'running') { Tone.context.resume(); } const now = Tone.now(); synth.triggerAttackRelease("C5", "16n", now); synth.triggerAttackRelease("G4", "16n", now + 0.1); synth.triggerAttackRelease("C5", "16n", now + 0.2); synth.triggerAttackRelease("G4", "16n", now + 0.3); synth.triggerAttackRelease("E5", "8n", now + 0.4); } catch (e) { console.error("Ses çalınamadı:", e); } };
const CustomTooltip = ({ active, payload, label }) => { if (active && payload && payload.length) { return <div className="bg-white p-2 border border-gray-300 rounded shadow-lg"><p className="font-bold">{label}</p><p className="text-sm">{`Sayı: ${payload[0].value}`}</p></div>; } return null; };
const FileUploader = ({ onFileAccepted, children, title, disabled }) => { const onDrop = useCallback(acceptedFiles => { onFileAccepted(acceptedFiles[0]); }, [onFileAccepted]); const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, disabled }); return <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${disabled ? 'bg-gray-100 text-gray-400' : 'cursor-pointer'} ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}><input {...getInputProps()} /><p className="text-gray-500">{title}</p>{children}</div>; };
const Modal = ({ isOpen, onClose, children }) => { if (!isOpen) return null; return <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto">{children}</div></div>; };
const WarningModal = ({ isOpen, onClose, title, warnings, barcode }) => { const [isCopied, setIsCopied] = useState(false); const handleCopy = (text) => { const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); try { document.execCommand('copy'); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch (err) { console.error("Panoya kopyalanamadı: ", err); } document.body.removeChild(textArea); }; const onLoanWarning = warnings.find(w => w.id === 'onLoan'); return <Modal isOpen={isOpen} onClose={onClose}><div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-bold text-gray-800">{title}</h3><button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button></div><div className="p-5"><ul className="space-y-2 list-disc list-inside">{warnings.map(w => <li key={w.id} style={{color: w.color}} className="font-semibold">{w.message}</li>)}</ul>{onLoanWarning && barcode && <div className="mt-4 p-3 bg-gray-100 rounded-lg border border-gray-200"><p className="text-sm font-medium">Bu materyali Koha'da iade almak için:</p><a href={`https://personel.ekutuphane.gov.tr/cgi-bin/koha/circ/returns.pl`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold block mt-2 hover:text-blue-800 transition-colors">Koha İade Sayfasına Git</a><p className="text-xs text-gray-500 mt-1">İade sayfasını açtıktan sonra aşağıdaki barkodu yapıştırabilirsiniz.</p><div className="mt-3 flex items-center gap-2"><input type="text" readOnly value={barcode} className="w-full p-2 border bg-gray-200 rounded-md font-mono text-sm" /><button onClick={() => handleCopy(barcode)} className={`px-4 py-2 rounded-md text-white font-semibold transition-colors ${isCopied ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}>{isCopied ? 'Kopyalandı!' : 'Barkodu Kopyala'}</button></div></div>}<button onClick={onClose} className="mt-6 bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 w-full font-bold">Tamam</button></div></Modal>; };
const ConfirmationModal = ({ isOpen, onClose, message, onConfirm }) => { if (!isOpen) return null; const handleConfirm = () => { onConfirm(); onClose(); }; return <Modal isOpen={isOpen} onClose={onClose}><div className="p-6 text-center"><h3 className="text-lg font-medium text-gray-800 mb-4">{message}</h3><div className="flex justify-center gap-4"><button onClick={onClose} className="px-6 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold">Hayır</button><button onClick={handleConfirm} className="px-6 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-semibold">Evet, Sil</button></div></div></Modal>; };
const AddDataModal = ({ isOpen, onClose, onAdd, type }) => { const [code, setCode] = useState(''); const [name, setName] = useState(''); const handleAdd = () => { if(code && name) { onAdd(type, code, name); onClose(); setCode(''); setName(''); } }; return <Modal isOpen={isOpen} onClose={onClose}><div className="p-5"><h3 className="text-lg font-bold mb-4">Yeni {type === 'library' ? 'Kütüphane' : 'Lokasyon'} Ekle</h3><div className="space-y-4"><input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Kod" className="w-full p-2 border border-gray-300 rounded-md" /><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="İsim" className="w-full p-2 border border-gray-300 rounded-md" /></div><div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200">İptal</button><button onClick={handleAdd} className="px-4 py-2 rounded-md bg-blue-600 text-white">Ekle</button></div></div></Modal>; };
const CameraScanner = ({ onScanSuccess, onClose }) => { const qrcodeRegionId = "html5qr-code-full-region"; const scannerRef = useRef(null); useEffect(() => { if (!window.Html5Qrcode) { console.error("Html5Qrcode library not loaded."); onClose(); return; } const html5QrCode = new window.Html5Qrcode(qrcodeRegionId); scannerRef.current = html5QrCode; const startCamera = async () => { try { await html5QrCode.start( { facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 }, supportedScanTypes: [window.Html5QrcodeScanType.SCAN_TYPE_CAMERA] }, onScanSuccess, (errorMessage) => {} ); } catch (err) { console.error("Kamera başlatılamadı:", err); onClose(); } }; startCamera(); return () => { if (scannerRef.current && scannerRef.current.isScanning) { scannerRef.current.stop().catch(err => console.error("Kamera durdurulurken hata oluştu:", err)); } }; }, [onScanSuccess, onClose]); return ( <div className="fixed inset-0 bg-black z-40 flex flex-col items-center justify-center p-4"> <div id={qrcodeRegionId} className="w-full max-w-md bg-white"></div> <button onClick={onClose} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md font-bold">Kamerayı Kapat</button> </div> ); };

export default function App() {
    const isXlsxReady = useScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX');
    const isQrCodeReady = useScript('https://unpkg.com/html5-qrcode', 'Html5Qrcode');

    const [page, setPage] = useState('start');
    const [sessions, setSessions] = useState({});
    const [currentSessionName, setCurrentSessionName] = useState('');
    const [sessionNameInput, setSessionNameInput] = useState('');
    const [selectedLibrary, setSelectedLibrary] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');
    const [kohaData, setKohaData] = useState([]);
    const [kohaDataMap, setKohaDataMap] = useState(new Map());
    const [scannedItems, setScannedItems] = useState([]);
    const [lastScanned, setLastScanned] = useState(null);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [warningModal, setWarningModal] = useState({ isOpen: false, title: '', warnings: [], barcode: null });
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, message: '', onConfirm: () => {} });
    const [addDataModal, setAddDataModal] = useState({ isOpen: false, type: ''});
    const [customLibraries, setCustomLibraries] = useState({});
    const [customLocations, setCustomLocations] = useState({});
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraPermission, setCameraPermission] = useState('prompt'); 
    const [permissionGrantedMessage, setPermissionGrantedMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [warningFilter, setWarningFilter] = useState('all');
    
    const lastCameraScanRef = useRef({ barcode: '', timestamp: 0 });

    useEffect(() => { try { const savedSessions = localStorage.getItem('kohaInventorySessions'); if (savedSessions) setSessions(JSON.parse(savedSessions)); const savedLibs = localStorage.getItem('customLibraries'); if (savedLibs) setCustomLibraries(JSON.parse(savedLibs)); const savedLocs = localStorage.getItem('customLocations'); if (savedLocs) setCustomLocations(JSON.parse(savedLocs)); } catch (e) { console.error("Veriler yüklenemedi:", e); } }, []);
    
    useEffect(() => {
        if (currentSessionName) {
            setSessions(prevSessions => {
                const sessionData = { name: currentSessionName, library: selectedLibrary, location: selectedLocation, items: scannedItems, lastUpdated: new Date().toISOString() };
                const newSessions = { ...prevSessions, [currentSessionName]: sessionData };
                if (JSON.stringify(prevSessions[currentSessionName]) !== JSON.stringify(sessionData)) {
                    try {
                        localStorage.setItem('kohaInventorySessions', JSON.stringify(newSessions));
                    } catch (e) {
                         console.error("Oturum kaydedilemedi:", e);
                         setError("Oturum kaydedilemedi. Tarayıcı depolama alanı dolu olabilir.");
                    }
                }
                return newSessions;
            });
        }
    }, [currentSessionName, selectedLibrary, selectedLocation, scannedItems]);

    const startNewSession = () => { if (!sessionNameInput) { setError("Lütfen yeni sayım için bir isim girin."); return; } if (sessions[sessionNameInput]) { setError("Bu isimde bir sayım zaten mevcut. Farklı bir isim seçin."); return; } const newSession = { name: sessionNameInput, library: '', location: '', items: [], lastUpdated: new Date().toISOString() }; setSessions({...sessions, [sessionNameInput]: newSession}); setCurrentSessionName(sessionNameInput); setSelectedLibrary(''); setSelectedLocation(''); setKohaData([]); setKohaDataMap(new Map()); setScannedItems([]); setLastScanned(null); setError(''); setPage('setup'); };
    const loadSession = (sessionName) => { const session = sessions[sessionName]; if(session){ setCurrentSessionName(session.name); setSelectedLibrary(session.library); setSelectedLocation(session.location); setScannedItems(session.items || []); setLastScanned(session.items && session.items.length > 0 ? session.items[0] : null); setKohaData([]); setKohaDataMap(new Map()); setPage('setup'); setError("Kayıtlı oturum yüklendi. Lütfen devam etmek için ilgili Koha Excel dosyasını tekrar yükleyin.")} };
    const deleteSession = (sessionName) => { setConfirmationModal({ isOpen: true, message: `"${sessionName}" isimli sayımı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`, onConfirm: () => { const newSessions = { ...sessions }; delete newSessions[sessionName]; setSessions(newSessions); localStorage.setItem('kohaInventorySessions', JSON.stringify(newSessions)); } }); };
    
    const handleAddCustomData = (type, code, name) => {
        if (type === 'library') {
            const newCustomLibraries = {...customLibraries, [code]: name};
            setCustomLibraries(newCustomLibraries);
            localStorage.setItem('customLibraries', JSON.stringify(newCustomLibraries));
            setSelectedLibrary(code);
        } else {
            const newCustomLocations = {...customLocations, [code]: name};
            setCustomLocations(newCustomLocations);
            localStorage.setItem('customLocations', JSON.stringify(newCustomLocations));
            setSelectedLocation(code);
        }
    };
    
    const combinedLibraries = useMemo(() => ({...INITIAL_LIBRARIES, ...customLibraries}), [customLibraries]);
    const combinedLocations = useMemo(() => ({...INITIAL_LOCATIONS, ...customLocations}), [customLocations]);

    const handleExcelUpload = (file) => {
        if (!file || !isXlsxReady) return;
        setIsLoading(true);
        setError('');
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = window.XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = window.XLSX.utils.sheet_to_json(worksheet);
                if (json.length === 0 || !json[0].hasOwnProperty('BARKOD')) throw new Error("Yüklenen dosyada 'BARKOD' sütunu bulunamadı.");
                setKohaData(json);
                setKohaDataMap(new Map(json.map(item => [String(item.BARKOD), item])));
            } catch (err) { setError(`Dosya okunurken bir hata oluştu: ${err.message}`); } finally { setIsLoading(false); }
        };
        reader.onerror = () => { setIsLoading(false); setError("Dosya okuma başarısız oldu."); }
        reader.readAsArrayBuffer(file);
    };
    
    const processBarcode = useCallback((barcode) => {
        if (!barcode || !selectedLibrary) return false;
        let originalBarcode = String(barcode).trim().replace(/[^0-9]/g, '');
        let normalizedBarcode = originalBarcode;
        let wasAutoCompleted = false;

        const expectedPrefix = String(parseInt(selectedLibrary, 10) + 1000);

        if (normalizedBarcode.length >= 13) { 
            normalizedBarcode = normalizedBarcode.slice(0, 12);
        }
        
        if(normalizedBarcode.length < 12 && normalizedBarcode.length > 0) {
             wasAutoCompleted = true; 
             normalizedBarcode = expectedPrefix + originalBarcode.padStart(12 - expectedPrefix.length, '0');
        }
        
        if (normalizedBarcode.length === 12 && !normalizedBarcode.startsWith(expectedPrefix)) {
            const allLibraryPrefixes = Object.keys(combinedLibraries).map(code => String(parseInt(code, 10) + 1000));
            const hasKnownPrefix = allLibraryPrefixes.some(prefix => normalizedBarcode.startsWith(prefix));
            
            let warning;
            if (hasKnownPrefix) {
                warning = WARNING_DEFINITIONS.wrongLibrary;
            } else {
                warning = WARNING_DEFINITIONS.invalidStructure;
            }
            
            const scanResult = { barcode: originalBarcode, isValid: false, warnings: [warning], data: null, timestamp: new Date().toISOString() };
            setLastScanned(scanResult);
            setScannedItems(prev => [scanResult, ...prev]);
            playSound(warning.sound);
            setWarningModal({ isOpen: true, title: 'Hatalı Barkod', warnings: [warning], barcode: originalBarcode });
            return true;
        }

        if (scannedItems.some(item => item.barcode === normalizedBarcode && item.timestamp)) { const warning = WARNING_DEFINITIONS.duplicate; setLastScanned({ barcode: normalizedBarcode, isValid: false, warnings: [warning], data: null, timestamp: null }); playSound(warning.sound); setWarningModal({ isOpen: true, title: 'Tekrar Eden Barkod', warnings: [warning], barcode: normalizedBarcode }); return true; }
        const itemData = kohaDataMap.get(normalizedBarcode);
        const warnings = [];
        if (itemData) {
            if (String(itemData['KÜTÜPHANE KODU'] || '') !== selectedLibrary) warnings.push(WARNING_DEFINITIONS.wrongLibrary);
            if (selectedLocation && String(itemData['MATERYALİN YERİ KODU'] || '') !== selectedLocation) warnings.push(WARNING_DEFINITIONS.locationMismatch);
            
            const loanEligibilityCode = String(itemData['ÖDÜNÇ VERİLEBİLİRLİK KODU']);
            if (!['0', '2'].includes(loanEligibilityCode)) {
                 const loanStatusText = itemData['ÖDÜNÇ VERİLEBİLİRLİK DURUMU'] || 'Bilinmiyor';
                 warnings.push({
                     ...WARNING_DEFINITIONS.notLoanable,
                     message: `Ödünç Verilemez (${loanStatusText})`
                 });
            }
            
            if (itemData.hasOwnProperty('MATERYAL STATÜSÜ KODU')) {
                if (String(itemData['MATERYAL STATÜSÜ KODU']) !== '0') {
                    warnings.push(WARNING_DEFINITIONS.notInCollection);
                }
            } else if (itemData.hasOwnProperty('MATERYAL STATÜSÜ')) {
                if (String(itemData['MATERYAL STATÜSÜ']) !== '0') {
                    warnings.push(WARNING_DEFINITIONS.notInCollection);
                }
            }
            
            if (['0', '1'].includes(String(itemData['ŞİKAYET / KHK DURUMU']))) warnings.push(WARNING_DEFINITIONS.complaintKHK);
            if (itemData['İADE EDİLMESİ GEREKEN TARİH']) warnings.push(WARNING_DEFINITIONS.onLoan);
        } else {
             if (wasAutoCompleted) {
                warnings.push(WARNING_DEFINITIONS.autoCompletedNotFound);
             } else {
                warnings.push(WARNING_DEFINITIONS.deleted);
             }
        }
        
        const scanResult = { barcode: normalizedBarcode, isValid: warnings.length === 0, hasWarnings: warnings.length > 0, warnings, data: itemData, timestamp: new Date().toISOString() };
        setLastScanned(scanResult);
        setScannedItems(prev => [scanResult, ...prev]);
        
        if (warnings.length > 0) {
            if (warnings.length > 1) {
                playMultipleWarningSound();
            } else {
                playSound(warnings[0].sound);
            }
            setWarningModal({ isOpen: true, title: 'Uyarılar', warnings: warnings, barcode: normalizedBarcode });
            return true;
        } else {
            playSound('C5');
            return false;
        }
    }, [selectedLibrary, selectedLocation, kohaDataMap, scannedItems, combinedLibraries]);

    const handleCameraScanSuccess = useCallback((decodedText) => {
        const now = Date.now();
        if (decodedText === lastCameraScanRef.current.barcode && (now - lastCameraScanRef.current.timestamp) < 2000) {
            return;
        }
        lastCameraScanRef.current = { barcode: decodedText, timestamp: now };
        
        const hasWarning = processBarcode(decodedText);
        
        if (hasWarning) {
            setIsCameraOpen(false);
        }
    }, [processBarcode]);

    const requestCameraPermission = async () => {
        setError('');
        setPermissionGrantedMessage('');

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
                setCameraPermission('granted');
                setPermissionGrantedMessage('Kamera erişim izni başarıyla verildi!');
                setError('');
                return true;
            } catch (err) {
                console.error("Kamera izni hatası:", err.name, err.message);
                setCameraPermission('prompt');
                if (err.name === 'NotAllowedError') {
                    setError("Kamera izni verilmedi veya istem kapatıldı. Lütfen tekrar deneyin.");
                } else {
                    setError("Kamera başlatılırken bir hata oluştu: " + err.message);
                }
                return false;
            }
        } else {
            setError("Tarayıcınız kamera erişimini desteklemiyor.");
            setCameraPermission('denied');
            return false;
        }
    };
    
    const handleBarcodeInput = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setBarcodeInput(value);
        if (value.length >= 12) {
            processBarcode(value);
            setBarcodeInput('');
        }
    };
    
    const handleDeleteItem = (timestampToDelete) => { setConfirmationModal({ isOpen: true, message: "Bu kaydı silmek istediğinizden emin misiniz?", onConfirm: () => { setScannedItems(currentItems => { const newItems = currentItems.filter(item => item.timestamp !== timestampToDelete); if (lastScanned && lastScanned.timestamp === timestampToDelete) setLastScanned(newItems.length > 0 ? newItems[0] : null); return newItems; }); } }); };
    
    const handleManualEntry = (e) => { e.preventDefault(); if (barcodeInput) { processBarcode(barcodeInput); setBarcodeInput(''); } };

    const handleTxtUpload = (file) => { if (!file) return; const reader = new FileReader(); reader.onload = (e) => { const barcodes = e.target.result.split(/\r?\n/).filter(line => line.trim() !== ''); barcodes.forEach(b => processBarcode(b)); }; reader.readAsText(file); };

    const handleOpenCameraClick = async () => {
        setError('');
        if (cameraPermission === 'granted') {
            setIsCameraOpen(true);
            return;
        }
        
        if (cameraPermission === 'denied') {
            setError("Kamera izni daha önce reddedildi. Lütfen tarayıcı ayarlarından bu site için kamera iznini etkinleştirin.");
            return;
        }

        const hasPermission = await requestCameraPermission();

        if (hasPermission) {
            setIsCameraOpen(true);
        }
    };

    const filteredScannedItems = useMemo(() => scannedItems.filter(item => (searchTerm ? (item.barcode.includes(searchTerm) || String(item.data?.['ESER ADI'] || '').toLowerCase().includes(searchTerm.toLowerCase())) : true) && (warningFilter === 'all' ? true : item.warnings.some(w => w.id === warningFilter))), [scannedItems, searchTerm, warningFilter]);

    // --- Report Generation ---
    const downloadTxt = (data, filename) => { const blob = new Blob([data], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); };
    const downloadXlsx = (data, filename) => { if (!isXlsxReady) { alert("Excel kütüphanesi hazır değil."); return; } const ws = window.XLSX.utils.json_to_sheet(data); const wb = window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb, ws, "Rapor"); window.XLSX.writeFile(wb, filename); };
    
    const REPORTS_CONFIG = useMemo(() => [
        { id: 'writeOff', title: 'Düşüm İşlemi İçin Barkodlar', format: '.txt', icon: ICONS.writeOff, description: "Bu dosya, Koha Materyal Düzeltme/Düşüm Modülü'ne yüklenerek materyallerin topluca düşümünü sağlar.", links: [{ text: 'Koha Düşüm Modülü', url: 'https://personel.ekutuphane.gov.tr/cgi-bin/koha/tools/batchMod.pl' }, { text: 'Genel Kullanım Kılavuzu', url: 'https://drive.google.com/drive/u/1/folders/1Rez8t9wLl_6u1uNTkGRFURbsvTX58sVK' }], notes: ['Sadece Müdür/Yönetici yetkisine sahip personel erişebilir.', 'Yetkisi olmayanlar koha@ktb.gov.tr adresinden talep edebilir.'], generator: () => { const scannedBarcodes = new Set(scannedItems.map(i => i.barcode)); const missingBarcodes = kohaData.filter(i => String(i['KÜTÜPHANE KODU']) === selectedLibrary && !scannedBarcodes.has(String(i.BARKOD))).map(i => String(i.BARKOD).slice(0, 12)); downloadTxt(missingBarcodes.join('\n'), `dusum_icin_eksik_barkodlar_${currentSessionName}.txt`); } },
        { id: 'missing', title: 'Eksik Materyaller', format: '.xlsx', icon: ICONS.missing, description: 'Sayım sırasında hiç okutulmamış olan, kütüphane koleksiyonuna ait materyallerin listesi.', generator: () => { const scannedBarcodes = new Set(scannedItems.map(i => i.barcode)); const missingItems = kohaData.filter(i => String(i['KÜTÜPHANE KODU']) === selectedLibrary && !scannedBarcodes.has(String(i.BARKOD))); downloadXlsx(missingItems, `eksik_materyaller_${currentSessionName}.xlsx`); } },
        { id: 'invalidStructure', title: '❗ Yapıya Uygun Olmayan Barkodlar', format: '.xlsx', icon: ICONS.complaint, description: 'Barkod yapısı, bilinen hiçbir kütüphane koduna uymayan barkodlar.', generator: () => { const data = scannedItems.filter(i => i.warnings.some(w => w.id === 'invalidStructure')).map(i => ({ Hatalı_Barkod: i.barcode })); downloadXlsx(data, `yapiya_uygun_olmayanlar_${currentSessionName}.xlsx`); } },
        { id: 'deletedScanned', title: '❗ Listede Olmayan ve Sayımı Yapılan Barkod', format: '.xlsx', icon: ICONS.complaint, description: 'Barkod listede bulunamadı (muhtemelen sistemden silinmiş veya hatalı girilmiş vs.).', generator: () => { const data = scannedItems.filter(i => i.warnings.some(w => w.id === 'deleted' || w.id === 'autoCompletedNotFound')).map(i => ({ Barkod: i.barcode, 'Not': 'Okutuldu, listede bulunamadı' })); downloadXlsx(data, `listede_olmayan_okutulanlar_${currentSessionName}.xlsx`); } },
        { id: 'allResults', title: 'Tüm Sonuçlar (Uyarılar Dahil)', format: '.xlsx', icon: ICONS.all, description: 'Sayım boyunca okutulan tüm materyallerin, aldıkları uyarılarla birlikte tam listesi.', generator: () => { const data = scannedItems.map(i => ({ Barkod: i.barcode, 'Eser Adı': i.data?.['ESER ADI'] || '', Uyarılar: i.warnings.map(w => w.text).join(', ') || 'Temiz', ...i.data })); downloadXlsx(data, `tum_sonuclar_${currentSessionName}.xlsx`); } },
        { id: 'cleanList', title: 'Temiz Liste (Uyarısız)', format: '.xlsx', icon: ICONS.clean, description: 'Hiçbir uyarı almayan, durumu ve konumu doğru olan materyallerin listesi.', generator: () => { const data = scannedItems.filter(i => i.isValid).map(i => i.data); downloadXlsx(data, `temiz_liste_${currentSessionName}.xlsx`); } },
        { id: 'wrongLibrary', title: 'Kütüphanenize Ait Olmayan Ancak Okunan Barkodlar', format: '.xlsx', icon: ICONS.wrongLib, description: 'Sayım yapılan kütüphaneye ait olmayan (farklı şube koduna sahip) materyaller.', generator: () => { const data = scannedItems.filter(i => i.warnings.some(w => w.id === 'wrongLibrary')).map(i => i.data); downloadXlsx(data, `kutuphane_disi_${currentSessionName}.xlsx`); } },
        { id: 'locationMismatch', title: 'Yer Uyumsuzları', format: '.xlsx', icon: ICONS.location, description: 'Başlangıçta seçilen lokasyon dışında bir yerde okutulan materyaller.', generator: () => { const data = scannedItems.filter(i => i.warnings.some(w => w.id === 'locationMismatch')).map(i => i.data); downloadXlsx(data, `yer_uyumsuz_${currentSessionName}.xlsx`); } },
        { id: 'notLoanableScanned', title: 'Statüsü Ödünç Verilebilir Olmayan (Devir/Düşüm Olan) Materyaller', format: '.xlsx', icon: ICONS.notLoanable, description: 'Ödünç verilebilirlik durumu "uygun değil" olarak işaretlenmiş materyaller.', generator: () => { const data = kohaData.filter(i => !['0', '2'].includes(String(i['ÖDÜNÇ VERİLEBİLİRLİK KODU']))); downloadXlsx(data, `odunc_verilemeyenler_${currentSessionName}.xlsx`); } },
        { id: 'statusIssues', title: 'Düşüm / Devir Statüsündekiler', format: '.xlsx', icon: ICONS.status, description: 'Materyal statüsü "düşüm" veya "devir" gibi koleksiyon dışı bir durumu gösteren materyaller.', generator: () => { const data = scannedItems.filter(i => i.warnings.some(w => w.id === 'notInCollection')).map(i => i.data); downloadXlsx(data, `dusum_devir_statulu_${currentSessionName}.xlsx`); } },
        { id: 'complaints', title: 'Şikayet / KHK Durumu Olanlar (Okutulan)', format: '.xlsx', icon: ICONS.complaint, description: 'Sayım sırasında okutulan ve üzerinde "Şikayet" veya "KHK" bildirimi bulunan materyaller.', generator: () => { const data = scannedItems.filter(i => i.warnings.some(w => w.id === 'complaintKHK')).map(i => ({ ...i.data, 'Durum': String(i.data['ŞİKAYET / KHK DURUMU']) === '0' ? 'KHK' : 'Şikayet' })); downloadXlsx(data, `okutulan_sikayet_khk_durumu_${currentSessionName}.xlsx`); } },
        { id: 'onLoan', title: 'Ödünçteki Materyaller', format: '.xlsx', icon: ICONS.onLoan, description: 'Koha verisine göre halihazırda bir okuyucunun üzerinde ödünçte görünen materyaller.', generator: () => { const data = kohaData.filter(i => String(i['ÖDÜNÇTE Mİ']) === '1').map(i => ({ 'İade Tarihi': i['ÖDÜNÇTEKİ MATERYALİN İADE EDİLMESİ GEREKEN TARİH'], ...i })); downloadXlsx(data, `oduncteki_materyaller_${currentSessionName}.xlsx`); } }
    ], [kohaData, scannedItems, currentSessionName, selectedLibrary, isXlsxReady]);

    const summaryData = useMemo(() => { if(scannedItems.length === 0) return null; const valid = scannedItems.filter(item => item.isValid).length; const kohaBarcodes = new Set(kohaData.map(item => String(item.BARKOD))); const scannedBarcodes = new Set(scannedItems.map(item => item.barcode)); const notScannedCount = [...kohaBarcodes].filter(b => !scannedBarcodes.has(b)).length; const warningCounts = scannedItems.flatMap(item => item.warnings).reduce((acc, warning) => { acc[warning.id] = (acc[warning.id] || 0) + 1; return acc; }, {}); let scanSpeed = 0; if(scannedItems.length > 1){ const firstScanTime = new Date(scannedItems[scannedItems.length - 1].timestamp).getTime(); const lastScanTime = new Date(scannedItems[0].timestamp).getTime(); const durationMinutes = (lastScanTime - firstScanTime) / (1000 * 60); scanSpeed = durationMinutes > 0 ? Math.round(scannedItems.length / durationMinutes) : "∞"; } const locationMismatches = scannedItems.filter(i => i.warnings.some(w => w.id === 'locationMismatch')).reduce((acc, item) => { const loc = item.data['MATERYALİN YERİ'] || 'Bilinmeyen'; acc[loc] = (acc[loc] || 0) + 1; return acc; }, {}); const materialTypes = scannedItems.reduce((acc, item) => { const type = item.data?.['MATERYAL TÜRÜ'] || 'Bilinmiyor'; acc[type] = (acc[type] || 0) + 1; return acc; }, {}); return { totalScanned: scannedItems.length, valid, invalid: scannedItems.length - valid, notScannedCount, scanSpeed, pieData: [ { name: 'Geçerli', value: valid }, { name: 'Uyarılı', value: scannedItems.length - valid }, { name: 'Eksik', value: notScannedCount } ], warningBarData: Object.entries(warningCounts).map(([id, count]) => ({ name: WARNING_DEFINITIONS[id]?.text || id, sayı: count })), locationMismatchData: Object.entries(locationMismatches).map(([name, count]) => ({name, sayı: count})), materialTypeData: Object.entries(materialTypes).map(([name, count]) => ({name, value: count}))}; }, [scannedItems, kohaData]);
    
    // --- Render Functions ---
    const renderStartScreen = () => <div className="max-w-4xl mx-auto p-8 bg-white rounded-xl shadow-lg space-y-8">
        <div className="text-center"><h1 className="text-4xl font-bold text-gray-800">Koha Çevrimdışı Sayım</h1><p className="text-gray-600 mt-2">Yeni bir sayım başlatın veya kayıtlı bir oturuma devam edin.</p></div>

        <div className="mt-4 p-4 bg-gray-50 border-l-4 border-gray-400 rounded-lg">
            <h4 className="font-bold text-gray-800">Kamera İzni</h4>
            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 my-2 rounded" role="alert"><p>{error}</p></div>}
            {permissionGrantedMessage && !error && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 my-2 rounded" role="alert"><p>{permissionGrantedMessage}</p></div>}
            
            {cameraPermission !== 'granted' &&
                <>
                    <p className="text-sm text-gray-700 mt-1">Kamera ile barkod okutma özelliğini kullanmak için tarayıcınızın kamera erişimine izin vermeniz gerekmektedir.</p>
                    <button onClick={requestCameraPermission} className="mt-2 px-4 py-2 bg-yellow-400 text-yellow-900 font-semibold rounded hover:bg-yellow-500">Kamera İznini Şimdi Ver</button>
                </>
            }
        </div>

        <div className="p-6 border border-gray-200 rounded-lg"><h2 className="text-2xl font-semibold mb-4">Yeni Sayım Başlat</h2><div className="flex flex-col sm:flex-row gap-2"><input type="text" value={sessionNameInput} onChange={e => {setSessionNameInput(e.target.value); setError('')}} onKeyDown={(e) => e.key === 'Enter' && startNewSession()} placeholder="Yeni sayım için bir isim girin (örn: Zemin Kat Romanlar)" className="flex-grow p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" /><button onClick={startNewSession} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-md hover:bg-blue-700 transition-colors">Başlat</button></div></div>
        <div className="p-6 border border-gray-200 rounded-lg"><h2 className="text-2xl font-semibold mb-4">Kayıtlı Oturumlar</h2>{Object.keys(sessions).length > 0 ? <ul className="space-y-3">{Object.values(sessions).sort((a,b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)).map(session => <li key={session.name} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-gray-50 rounded-lg border"><div><p className="font-bold">{session.name}</p><p className="text-sm text-gray-500">{new Date(session.lastUpdated).toLocaleString('tr-TR')} - {session.items.length} kayıt</p></div><div className="flex gap-2 mt-2 sm:mt-0"><button onClick={() => loadSession(session.name)} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">Yükle</button><button onClick={() => deleteSession(session.name)} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">Sil</button></div></li>)}</ul> : <p className="text-gray-500">Kayıtlı oturum bulunamadı.</p>}</div>
    </div>;

    const renderSetupScreen = () => <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg space-y-6"><h1 className="text-3xl font-bold text-gray-800">Sayım Kurulumu: "{currentSessionName}"</h1>{error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert"><p>{error}</p></div>}<div className="space-y-4"><div><label htmlFor="library-select" className="block text-sm font-medium text-gray-700 mb-1">Kütüphanenizi Seçin</label><div className="flex gap-2"><select id="library-select" value={selectedLibrary} onChange={(e) => setSelectedLibrary(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md shadow-sm"><option value="">-- Kütüphane Seçiniz --</option>{Object.entries(combinedLibraries).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select><button onClick={()=> setAddDataModal({isOpen: true, type: 'library'})} className="px-3 bg-gray-200 rounded-md hover:bg-gray-300">Yeni Ekle</button></div></div><div><label htmlFor="location-select" className="block text-sm font-medium text-gray-700 mb-1">Bölüm/Materyalin Yeri (Opsiyonel)</label><div className="flex gap-2"><select id="location-select" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md shadow-sm"><option value="">-- Tüm Lokasyonlar --</option>{Object.entries(combinedLocations).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select><button onClick={()=> setAddDataModal({isOpen: true, type: 'location'})} className="px-3 bg-gray-200 rounded-md hover:bg-gray-300">Yeni Ekle</button></div><p className="text-xs text-gray-500 mt-1">Yer seçimi yaparsanız, sayım yaptığınız yerde olmayan materyallerle ilgili uyarı verilecektir.</p></div></div><div><h3 className="text-sm font-medium text-gray-700 mb-1">Koha'dan Aldığınız Sayım İçin Hazırlanmış Dosya (.xlsx)</h3><FileUploader onFileAccepted={handleExcelUpload} title={kohaData.length > 0 ? `${kohaData.length} kayıt yüklendi.` : "Dosyayı buraya sürükleyin veya seçmek için tıklayın"} disabled={!isXlsxReady}><svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></FileUploader>{isLoading && <p className="text-blue-600 mt-2">Dosya okunuyor...</p>}</div><button onClick={() => { if(selectedLibrary && kohaData.length > 0) setPage('scan'); else setError("Sayıma başlamak için Kütüphane seçmeli ve Excel dosyası yüklemelisiniz."); }} disabled={!selectedLibrary || kohaData.length === 0 || isLoading || !isXlsxReady} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400">Sayıma Devam Et</button><button onClick={() => setPage('start')} className="w-full mt-2 bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600">Geri</button></div>;
    const renderScanScreen = () => <>{isCameraOpen && isQrCodeReady && <CameraScanner onClose={() => setIsCameraOpen(false)} onScanSuccess={handleCameraScanSuccess} />} <div className="flex flex-col md:flex-row h-screen bg-gray-50"><div className="w-full md:w-1/3 lg:w-1/4 p-4 bg-white border-r flex flex-col"><div className="flex-grow space-y-4"><h2 className="text-xl font-bold text-gray-800">Sayım: {currentSessionName}</h2><div className="text-sm text-gray-600"><p><span className="font-semibold">Kütüphane:</span> {combinedLibraries[selectedLibrary]}</p><p><span className="font-semibold">Lokasyon:</span> {selectedLocation ? combinedLocations[selectedLocation] : 'Tümü'}</p></div><button onClick={handleOpenCameraClick} disabled={!isQrCodeReady} className="w-full flex items-center justify-center gap-2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400"> <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Kamera ile Tara</button><form onSubmit={handleManualEntry} className="space-y-2"><label htmlFor="barcode-input" className="font-semibold">Barkod Okut/Gir:</label><input id="barcode-input" type="tel" value={barcodeInput} onChange={handleBarcodeInput} placeholder="Barkodu okutun veya elle girin" className="w-full p-2 border border-gray-300 rounded-md" autoFocus /><button type="submit" className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600">Ekle</button></form>{lastScanned && <div className={`p-3 rounded-md border-l-4 ${lastScanned.isValid ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'}`}><p className="font-bold text-gray-800">{lastScanned.barcode}</p><p className="text-sm">{lastScanned.data?.['ESER ADI'] || 'Eser bilgisi bulunamadı'}</p>{lastScanned.warnings.map(w => <p key={w.id} style={{color: w.color}} className="text-sm font-semibold">{w.text}</p>)}</div>}</div><div className="mt-4 space-y-2"><div className='md:hidden'><label className="font-semibold">Toplu Yükleme (.txt):</label><FileUploader onFileAccepted={handleTxtUpload} title="Toplu barkod içeren .txt dosyasını sürükleyin" /></div><div className="hidden md:block"><label className="font-semibold">Toplu Yükleme (.txt):</label><FileUploader onFileAccepted={handleTxtUpload} title="Toplu barkod içeren .txt dosyasını sürükleyin" /></div><button onClick={() => setPage('summary')} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700">Özeti ve Raporları Gör</button><button onClick={() => setPage('start')} className="w-full bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600">Ana Menüye Dön</button></div></div><div className="w-full md:w-2/3 lg:w-3/4 p-4 flex flex-col"><h3 className="text-lg font-bold text-gray-800 mb-2">Okutulan Materyaller ({filteredScannedItems.length} / {scannedItems.length})</h3><div className="flex flex-col sm:flex-row gap-2 mb-2"><input type="text" placeholder="Barkod veya eserde ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow p-2 border border-gray-300 rounded-md" /><select value={warningFilter} onChange={e => setWarningFilter(e.target.value)} className="p-2 border border-gray-300 rounded-md"><option value="all">Tümünü Göster</option>{Object.values(WARNING_DEFINITIONS).filter(w => w.id !== 'duplicate').map(w => <option key={w.id} value={w.id}>{w.text}</option>)}</select></div><div className="flex-grow overflow-y-auto space-y-2 pr-2">{filteredScannedItems.map((item) => <div key={item.timestamp} className={`p-2 rounded-md border flex items-center justify-between gap-2 ${item.isValid ? 'bg-white' : 'bg-yellow-50'}`}><div className="flex-grow"><p className="font-mono text-gray-800">{item.barcode}</p><p className="text-xs text-gray-600">{item.data?.['ESER ADI'] || 'Bilinmeyen Eser'}</p></div><div className="flex items-center gap-2 flex-shrink-0"><div className="flex flex-wrap justify-end gap-1">{item.warnings.map(w => <span key={w.id} style={{backgroundColor: w.color, color: '#000'}} className="px-2 py-1 text-xs font-semibold rounded-full">{w.text}</span>)}{item.isValid && <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Temiz</span>}</div><button onClick={() => handleDeleteItem(item.timestamp)} className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600" title="Bu kaydı sil"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button></div></div>)}</div></div></div></>;
    const renderSummaryScreen = () => { if (!summaryData) return <div className="p-8 text-center"><p>Özet oluşturmak için henüz yeterli veri yok.</p><button onClick={() => setPage('scan')} className="mt-4 bg-blue-600 text-white font-bold py-2 px-4 rounded-md">Sayım Ekranına Dön</button></div>; return <div className="p-4 md:p-8 bg-gray-100 min-h-screen"><div className="max-w-7xl mx-auto bg-white p-6 rounded-xl shadow-lg"><div className="flex justify-between items-start mb-6"><h1 className="text-3xl font-bold text-gray-800">Sayım Özeti: {currentSessionName}</h1><button onClick={() => setPage('scan')} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md">Sayım Ekranına Dön</button></div><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 text-center"><div className="bg-blue-100 p-4 rounded-lg"><p className="text-2xl font-bold text-blue-800">{summaryData.totalScanned}</p><p>Toplam Okutulan</p></div><div className="bg-green-100 p-4 rounded-lg"><p className="text-2xl font-bold text-green-800">{summaryData.valid}</p><p>Geçerli (Temiz)</p></div><div className="bg-yellow-100 p-4 rounded-lg"><p className="text-2xl font-bold text-yellow-800">{summaryData.invalid}</p><p>Hatalı/Uyarılı</p></div><div className="bg-gray-200 p-4 rounded-lg"><p className="text-2xl font-bold text-gray-800">{summaryData.notScannedCount}</p><p>Eksik</p></div><div className="bg-indigo-100 p-4 rounded-lg"><p className="text-2xl font-bold text-indigo-800">{summaryData.scanSpeed}</p><p>Materyal / dk</p></div></div><div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8"><div className="h-80"><h3 className="text-xl font-semibold mb-2 text-center">Genel Durum</h3><ResponsiveContainer><PieChart><Pie data={summaryData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>{summaryData.pieData.map((entry, i) => <Cell key={`cell-${i}`} fill={PIE_CHART_COLORS[entry.name === 'Geçerli' ? 'valid' : entry.name === 'Uyarılı' ? 'invalid' : 'missing']} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div><div className="h-80"><h3 className="text-xl font-semibold mb-2 text-center">Materyal Türü Dağılımı</h3><ResponsiveContainer><PieChart><Pie data={summaryData.materialTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({cx,cy,midAngle,innerRadius,outerRadius,percent}) => { const r = innerRadius+(outerRadius-innerRadius)*0.5; const x=cx+r*Math.cos(-midAngle*Math.PI/180); const y=cy+r*Math.sin(-midAngle*Math.PI/180); return <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">{`${(percent*100).toFixed(0)}%`}</text>;}}>{summaryData.materialTypeData.map((e, i) => <Cell key={`cell-${i}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'][i % 5]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div><div className="h-80"><h3 className="text-xl font-semibold mb-2 text-center">Uyarı Türleri</h3><ResponsiveContainer><BarChart data={summaryData.warningBarData} layout="vertical" margin={{left: 100}}><CartesianGrid /><XAxis type="number" /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="sayı">{summaryData.warningBarData.map((e, i) => <Cell key={`cell-${i}`} fill={WARNING_DEFINITIONS[Object.keys(WARNING_DEFINITIONS).find(k => WARNING_DEFINITIONS[k].text === e.name)]?.color || '#8884d8'} />)}</Bar></BarChart></ResponsiveContainer></div>{summaryData.locationMismatchData.length > 0 && <div className="h-80 lg:col-span-2 xl:col-span-3"><h3 className="text-xl font-semibold mb-2 text-center">Konum Uyuşmazlığı Olan Raflar</h3><ResponsiveContainer><BarChart data={summaryData.locationMismatchData} margin={{bottom: 50}}><CartesianGrid /><XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} height={60} /><YAxis allowDecimals={false}/><Tooltip content={<CustomTooltip />} /><Bar dataKey="sayı" fill="#FAD7A0" /></BarChart></ResponsiveContainer></div>}</div><div className="mt-10"><h2 className="text-3xl font-bold mb-6 text-gray-800">Raporlar</h2><div className="space-y-4">{REPORTS_CONFIG.map(report => <div key={report.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-shadow hover:shadow-md"><div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div className="flex items-center gap-4 flex-grow"><div className="text-blue-600 flex-shrink-0 w-6 h-6">{report.icon}</div><div><h4 className="font-bold text-gray-800">{report.title}</h4><p className="text-sm text-gray-500">Format: {report.format}</p></div></div><div className="flex-shrink-0 mt-2 sm:mt-0"><button onClick={report.generator} disabled={!isXlsxReady} className="flex items-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors">{ICONS.download} İndir</button></div></div><div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600 space-y-2"><p>{report.description}</p>{report.notes && <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">{report.notes.map((note,i) => <li key={i}>{note}</li>)}</ul>}{report.links && <div className="flex flex-col items-start gap-1">{report.links.map((link,i) => <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">{link.text}</a>)}</div>}</div></div>)}</div></div></div></div>; };
    
    return (
        <div className="bg-gray-100 min-h-screen font-sans flex flex-col">
          <div className="flex-grow pb-12">
            <WarningModal isOpen={warningModal.isOpen} onClose={() => setWarningModal({ isOpen: false, title: '', warnings: [], barcode: null })} {...warningModal} />
            <ConfirmationModal isOpen={confirmationModal.isOpen} onClose={() => setConfirmationModal({ isOpen: false, message: '', onConfirm: () => {} })} {...confirmationModal} />
            <AddDataModal isOpen={addDataModal.isOpen} onClose={() => setAddDataModal({isOpen: false, type: ''})} onAdd={handleAddCustomData} type={addDataModal.type} />
            
            {page === 'start' && renderStartScreen()}
            {page === 'setup' && renderSetupScreen()}
            {page === 'scan' && renderScanScreen()}
            {page === 'summary' && renderSummaryScreen()}
          </div>
          <div className="w-full bg-gray-800 text-white p-2 fixed bottom-0 z-10">
            <div className="max-w-7xl mx-auto flex justify-around text-sm">
                <button onClick={()=>setPage('start')} className={`flex items-center gap-2 ${page === 'start' ? 'font-bold text-yellow-300' : 'text-gray-400'}`}>1. Yeni Sayım</button>
                <button disabled={!currentSessionName} onClick={()=>setPage('setup')} className={`flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${page === 'setup' ? 'font-bold text-yellow-300' : 'text-gray-400'}`}>2. Kurulum</button>
                <button disabled={!selectedLibrary || kohaData.length === 0} onClick={()=>setPage('scan')} className={`flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${page === 'scan' ? 'font-bold text-yellow-300' : 'text-gray-400'}`}>3. Sayım</button>
                <button disabled={!selectedLibrary || kohaData.length === 0} onClick={()=>setPage('summary')} className={`flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${page === 'summary' ? 'font-bold text-yellow-300' : 'text-gray-400'}`}>4. Özet & Raporlar</button>
            </div>
          </div>
        </div>
    );
}
