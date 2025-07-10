import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList, LineChart, Line } from 'recharts';
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


// --- Robust Barcode Scanner Component ---
const RobustBarcodeScanner = ({ onScan, onClose, isPaused }) => {
    const readerId = "robust-barcode-scanner";
    const [message, setMessage] = useState({ text: 'Kamera başlatılıyor...', type: 'info' });
    const scannerRef = useRef(null);
    const throttleTimeoutRef = useRef(null);
    const scannedCodesThisSessionRef = useRef(new Set()); // Tracks codes scanned only while camera is open

    // Clean up the timer when the component is unmounted
    useEffect(() => {
        return () => {
            if (throttleTimeoutRef.current) {
                clearTimeout(throttleTimeoutRef.current);
            }
        };
    }, []);
    
    const handleScanResult = (decodedText) => {
        // Stop if paused (e.g., a modal is open) or if we are in a throttle cooldown
        if (isPaused || throttleTimeoutRef.current) {
            return;
        }

        if (scannedCodesThisSessionRef.current.has(decodedText)) {
            setMessage({ text: 'Bu barkod bu oturumda zaten okutuldu.', type: 'warning' });
            return;
        }

        scannedCodesThisSessionRef.current.add(decodedText);
        setMessage({ text: `Başarılı: ${decodedText}`, type: 'success' });
        onScan(decodedText); // Pass the new, unique barcode to the main application

        // Start a cooldown period to prevent re-scanning the same code immediately
        throttleTimeoutRef.current = setTimeout(() => {
            throttleTimeoutRef.current = null;
        }, 2000); // 2-second cooldown
    };

    useEffect(() => {
        if (!window.Html5Qrcode) {
             setMessage({ text: 'Tarayıcı kütüphanesi yüklenemedi.', type: 'error' });
            return;
        }

        const html5QrCode = new window.Html5Qrcode(readerId);
        scannerRef.current = html5QrCode;

        const startCamera = async () => {
            try {
                 setMessage({ text: 'Kamera başlatılıyor, lütfen bekleyin...', type: 'info' });
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    handleScanResult,
                    (errorMessage) => { /* Non-critical scan errors can be ignored */ }
                );
                 setMessage({ text: 'Okutmak için kamerayı barkoda yaklaştırın.', type: 'info' });
            } catch (err) {
                console.error("Kamera başlatma hatası:", err);
                if (err.name === 'NotAllowedError') {
                    setMessage({ text: 'Lütfen kamera erişimine izin verin.', type: 'error' });
                } else {
                    setMessage({ text: 'Kamera başlatılamadı.', type: 'error' });
                }
            }
        };

        startCamera();

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(err => console.error("Kamera durdurulurken hata oluştu:", err));
            }
        };
    }, [onScan]);

    const getMessageStyles = (type) => {
        switch (type) {
            case 'success': return 'bg-green-100 border-green-500 text-green-800';
            case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
            case 'error': return 'bg-red-100 border-red-500 text-red-800';
            default: return 'bg-blue-100 border-blue-500 text-blue-800';
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-40 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg overflow-hidden shadow-2xl">
                 <div id={readerId} />
                 <div
                    role="alert"
                    className={`p-4 text-center font-semibold border-t-4 ${getMessageStyles(message.type)}`}
                >
                    {message.text}
                </div>
            </div>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-slate-700 text-white rounded-md font-bold hover:bg-slate-800">Kamerayı Kapat</button>
        </div>
    );
};


// --- Data Constants & Icons ---
const INITIAL_LIBRARIES = [
 ["12", "ADANA İL HALK KÜTÜPHANESİ"],
["1530", "ADANA Adalet Halk Kütüphanesi"],
["1317", "ADANA Aladağ İlçe Halk Kütüphanesi"],
["113", "ADANA Ceyhan İlçe Halk Kütüphanesi"],
["1310", "ADANA Ceyhan Murat Göğebakan Kültür Merkezi Halk Kütüphanesi"],
["670", "ADANA Feke İlçe Halk Kütüphanesi"],
["760", "ADANA İmamoğlu Remzi Oğuz Arık İlçe Halk Kütüphanesi"],
["1200", "ADANA Karacaoğlan Edebiyat Müze Kütüphanesi"],
["796", "ADANA Karaisalı İlçe Halk Kütüphanesi"],
["675", "ADANA Kozan Gazi Halk Kütüphanesi"],
["114", "ADANA Kozan Karacaoğlan İlçe Halk Kütüphanesi"],
["1320", "ADANA Kozan Özden Kültür Merkezi Halk Kütüphanesi"],
["956", "ADANA Pozantı İlçe Halk Kütüphanesi"],
["499", "ADANA Saimbeyli Azmi Yazıcıoğlu İlçe Halk Kütüphanesi"],
["1588", "ADANA Sarıçam Bebek ve Çocuk Kütüphanesi"],
["1007", "ADANA Sarıçam İlçe Halk Kütüphanesi"],
["763", "ADANA Sarıçam İncirlik 100. Yıl Çocuk Kütüphanesi"],
["557", "ADANA Seyhan Çağdaş Çocuk Kütüphanesi"],
["1024", "ADANA Seyhan Şakirpaşa Halk Kütüphanesi"],
["995", "ADANA Seyhan Yusuf Fırat Kotan İlçe Halk Kütüphanesi"],
["1071", "ADANA Tufanbeyli İlçe Halk Kütüphanesi"],
["1135", "ADANA Yumurtalık İlçe Halk Kütüphanesi"],
["1139", "ADANA Yüreğir Hacı Mehmet Sabancı İlçe Halk Kütüphanesi"],
["1237", "ADANA Yüreğir Kültür Merkezi Çocuk ve Gençlik Kütüphanesi"],
["13", "ADIYAMAN İL HALK KÜTÜPHANESİ"],
["560", "ADIYAMAN Bebek ve Çocuk Kütüphanesi"],
["530", "ADIYAMAN Besni İlçe Halk Kütüphanesi"],
["1020", "ADIYAMAN Besni Suvarlı Halk Kütüphanesi"],
["115", "ADIYAMAN Çelikhan İlçe Halk Kütüphanesi"],
["681", "ADIYAMAN Gerger İlçe Halk Kütüphanesi"],
["528", "ADIYAMAN Gölbaşı Belören Halk Kütüphanesi"],
["116", "ADIYAMAN Gölbaşı İlçe Halk Kütüphanesi"],
["117", "ADIYAMAN Kahta İlçe Halk Kütüphanesi"],
["279", "ADIYAMAN Samsat İlçe Halk Kütüphanesi"],
["1003", "ADIYAMAN Sincik İlçe Halk Kütüphanesi"],
["1073", "ADIYAMAN Tut İlçe Halk Kütüphanesi"],
["1573", "ADIYAMAN Yeşilyurt Halk Kütüphanesi"],
["521", "AFYONKARAHİSAR Bayat İlçe Halk Kütüphanesi"],
["118", "AFYONKARAHİSAR Bolvadin İlçe Halk Kütüphanesi"],
["576", "AFYONKARAHİSAR Çay İlçe Halk Kütüphanesi"],
["1461", "AFYONKARAHİSAR Çobanlar İlçe Halk Kütüphanesi"],
["119", "AFYONKARAHİSAR Dazkırı İlçe Halk Kütüphanesi"],
["120", "AFYONKARAHİSAR Dinar İlçe Halk Kütüphanesi"],
["604", "AFYONKARAHİSAR Emirdağ Davulga Halk Kütüphanesi"],
["647", "AFYONKARAHİSAR Emirdağ İlçe Halk Kütüphanesi"],
["1401", "AFYONKARAHİSAR Evciler İlçe Halk Kütüphanesi"],
["14", "AFYONKARAHİSAR GEDİK AHMET PAŞA İL HALK KÜTÜPHANESİ"],
["744", "AFYONKARAHİSAR Hocalar İlçe Halk Kütüphanesi"],
["756", "AFYONKARAHİSAR İhsaniye İlçe Halk Kütüphanesi"],
["121", "AFYONKARAHİSAR Sandıklı 100. Yıl İlçe Halk Kütüphanesi"],
["1002", "AFYONKARAHİSAR Sinanpaşa İlçe Halk Kütüphanesi"],
["344", "AFYONKARAHİSAR Sultandağı Dereçine Halk Kütüphanesi"],
["1013", "AFYONKARAHİSAR Sultandağı İlçe Halk Kütüphanesi"],
["1123", "AFYONKARAHİSAR Sultandağı Yeşilçiftlik Halk Kütüphanesi"],
["1037", "AFYONKARAHİSAR Şuhut İlçe Halk Kütüphanesi"],
["15", "AĞRI İL HALK KÜTÜPHANESİ"],
["624", "AĞRI Diyadin İlçe Halk Kütüphanesi"],
["630", "AĞRI Doğubayazıt İlçe Halk Kütüphanesi"],
["644", "AĞRI Eleşkirt İlçe Halk Kütüphanesi"],
["726", "AĞRI Hamur İlçe Halk Kütüphanesi"],
["1338", "AĞRI Merkez Çocuk Kütüphanesi"],
["122", "AĞRI Patnos İlçe Halk Kütüphanesi"],
["1044", "AĞRI Taşlıçay İlçe Halk Kütüphanesi"],
["1074", "AĞRI Tutak İlçe Halk Kütüphanesi"],
["16", "AKSARAY İL HALK KÜTÜPHANESİ"],
["428", "AKSARAY Ağaçören İlçe Halk Kütüphanesi"],
["660", "AKSARAY Eskil İlçe Halk Kütüphanesi"],
["704", "AKSARAY Gülağaç İlçe Halk Kütüphanesi"],
["357", "AKSARAY Güzelyurt İlçe Halk Kütüphanesi"],
["446", "AKSARAY Merkez Kültür Merkezi Çocuk Kütüphanesi"],
["1163", "AKSARAY Ortaköy İlçe Halk Kütüphanesi"],
["980", "AKSARAY Sarıyahşi İlçe Halk Kütüphanesi"],
["10", "AMASYA İL HALK KÜTÜPHANESİ"],
["700", "AMASYA Göynücek İlçe Halk Kütüphanesi"],
["123", "AMASYA Gümüşhacıköy İlçe Halk Kütüphanesi"],
["725", "AMASYA Hamamözü İlçe Halk Kütüphanesi"],
["88", "AMASYA Merzifon İlçe Halk Kütüphanesi"],
["1015", "AMASYA Suluova İlçe Halk Kütüphanesi"],
["1045", "AMASYA Taşova İlçe Halk Kütüphanesi"],
["1507", "AMASYA Ziyaret Halk Kütüphanesi"],
["1151", "ANKARA ADNAN ÖTÜKEN İL HALK KÜTÜPHANESİ"],
["1412", "ANKARA Akyurt Bebek ve Çocuk Kütüphanesi"],
["450", "ANKARA Akyurt İlçe Halk Kütüphanesi"],
["802", "ANKARA Altındağ Bebek ve Çocuk Kütüphanesi"],
["1325", "ANKARA Altındağ İlçe Halk Kütüphanesi"],
["1563", "ANKARA Altındağ Mehmet Akif Halk Kütüphanesi"],
["684", "ANKARA Ayaş Göklerköyü Halk Kütüphanesi"],
["402", "ANKARA Ayaş İlçe Halk Kütüphanesi"],
["510", "ANKARA Bala İlçe Halk Kütüphanesi"],
["827", "ANKARA Bala Kesikköprü Halk Kütüphanesi"],
["124", "ANKARA Beypazarı M.Akif Ersoy İlçe Halk Kütüphanesi"],
["96", "ANKARA Cebeci Halk Kütüphanesi"],
["1152", "ANKARA Cer Modern Sanat Kütüphanesi"],
["564", "ANKARA Çamlıdere İlçe Halk Kütüphanesi"],
["126", "ANKARA Çankaya Ali Dayı Çocuk Kütüphanesi"],
["127", "ANKARA Çankaya Balgat Hüseyin Alpar Halk Kütüphanesi"],
["1534", "ANKARA Çankaya Çayyolu İkipınar Halk Kütüphanesi"],
["1570", "ANKARA Çankaya Kaygusuz Abdal Alevilik - Bektaşilik İhtisas Kütüphanesi"],
["125", "ANKARA Çankaya Sevgi Yılı İlçe Halk Kütüphanesi"],
["280", "ANKARA Çubuk İlçe Halk Kütüphanesi"],
["1153", "ANKARA Elmadağ Hasanoğlan 17 Nisan Halk Kütüphanesi"],
["645", "ANKARA Elmadağ İlçe Halk Kütüphanesi"],
["1422", "ANKARA Esenboğa Havalimanı Kütüphanesi"],
["1356", "ANKARA Etimesgut İlçe Halk Kütüphanesi"],
["404", "ANKARA Evren İlçe Halk Kütüphanesi"],
["1421", "Ankara Gar Kütüphanesi"],
["936", "ANKARA Gölbaşı Eymir Mehmet Halis Bozkurt Halk Kütüphanesi"],
["467", "ANKARA Gölbaşı Hasan Celal Güzel İlçe Halk Kütüphanesi"],
["703", "ANKARA Güdül İlçe Halk Kütüphanesi"],
["1460", "ANKARA Halk Kültürü Araştırmaları Kütüphanesi"],
["128", "ANKARA Haymana İlçe Halk Kütüphanesi"],
["814", "ANKARA Kahramankazan İlçe Halk Kütüphanesi"],
["785", "ANKARA Kalecik İlçe Halk Kütüphanesi"],
["1306", "ANKARA Keçiören Aktepe Halk Kütüphanesi"],
["1558", "ANKARA Keçiören Atapark Halk Kütüphanesi"],
["1562", "ANKARA Keçiören Atatürk Cumhuriyet Kulesi 100. Yıl Halk Kütüphanesi"],
["1351", "ANKARA Keçiören Bağlum Abdurrahim Karakoç Halk Kütüphanesi"],
["1557", "ANKARA Keçiören Basınevleri Halk Kütüphanesi"],
["1438", "ANKARA Keçiören Bebek ve Çocuk Kütüphanesi"],
["1259", "ANKARA Keçiören Cemil Meriç İlçe Halk Kütüphanesi"],
["1435", "ANKARA Keçiören Fatih Halk Kütüphanesi"],
["1465", "ANKARA Keçiören Hüseyin Nihal Atsız Halk Kütüphanesi"],
["1354", "ANKARA Keçiören Kuşcağız Halk Kütüphanesi"],
["1437", "ANKARA Keçiören Mehmet Ali Şahin Halk Kütüphanesi"],
["1436", "ANKARA Keçiören Mehmet Doğan Halk Kütüphanesi"],
["1391", "ANKARA Keçiören Nata Subayevleri Kütüphanesi (AVM)"],
["1355", "ANKARA Keçiören Osmanlı Halk Kütüphanesi"],
["1483", "ANKARA Keçiören Şenay Aybüke Yalçın Halk Kütüphanesi"],
["1439", "ANKARA Keçiören Yücel Hacaloğlu Halk Kütüphanesi"],
["130", "ANKARA Kızılcahamam İlçe Halk Kütüphanesi"],
["1384", "ANKARA Mamak Abidinpaşa Halk Kütüphanesi"],
["1451", "ANKARA Mamak Akdere Halk Kütüphanesi"],
["1470", "ANKARA Mamak Altınevler Koleksiyon Kütüphanesi"],
["1383", "ANKARA Mamak Amfi Halk Kütüphanesi"],
["1475", "ANKARA Mamak Demirlibahçe Halk Kütüphanesi"],
["277", "ANKARA Mamak İlçe Halk Kütüphanesi"],
["1450", "ANKARA Mamak Kıbrısköy Halk Kütüphanesi"],
["879", "ANKARA Mamak Kutludüğün Halk Kütüphanesi"],
["1467", "ANKARA Mamak Mutlu Halk Kütüphanesi"],
["1390", "ANKARA Mamak Nata Ankara Kütüphanesi (AVM)"],
["1386", "ANKARA Mamak Necip Fazıl Kısakürek Halk Kütüphanesi"],
["1382", "ANKARA Mamak Şafaktepe Şehitlik Halk Kütüphanesi"],
["1398", "ANKARA Mamak Üreğil Halk Kütüphanesi"],
["1397", "ANKARA Mamak Yeşilbayır Bebek ve Çocuk Kütüphanesi"],
["1385", "ANKARA Mamak Zirvekent Halk Kütüphanesi"],
["1192", "ANKARA Mehmet Akif Ersoy Edebiyat Müze Kütüphanesi"],
["918", "ANKARA Nallıhan İlçe Halk Kütüphanesi"],
["1381", "ANKARA Nuri Pakdil Edebiyat Müze Kütüphanesi"],
["2", "ANKARA Polatlı İlçe Halk Kütüphanesi"],
["281", "ANKARA Polatlı Yunusemre Halk Kütüphanesi"],
["1342", "ANKARA Pursaklar İlçe Halk Kütüphanesi"],
["1168", "ANKARA Pursaklar Saray Halk Kütüphanesi"],
["1430", "ANKARA Sincan Adalet Halk Kütüphanesi"],
["1399", "ANKARA Sincan Bebek ve Çocuk Kütüphanesi"],
["1343", "ANKARA Sincan Evliya Çelebi Halk Kütüphanesi"],
["131", "ANKARA Sincan İlçe Halk Kütüphanesi"],
["1202", "ANKARA Sincan Şuayip Çalkın Halk Kütüphanesi"],
["1001", "ANKARA Sincan Törekent Halk Kütüphanesi"],
["363", "ANKARA Sincan Yenikent Halk Kütüphanesi"],
["132", "ANKARA Şereflikoçhisar Yunusemre İlçe Halk Kütüphanesi"],
["1410", "ANKARA Telif İhtisas Kütüphanesi"],
["1568", "ANKARA Ticaret İhtisas Kütüphanesi"],
["1267", "ANKARA Yenimahalle Abdurrahman Oğultürk Halk Kütüphanesi"],
["1274", "ANKARA Yenimahalle İlçe Halk Kütüphanesi"],
["1204", "ANKARA Yenimahalle Şentepe Halk Kütüphanesi"],
["133", "ANTALYA Akseki Yeğen Mehmet Paşa İlçe Halk Kütüphanesi"],
["134", "ANTALYA Alanya İlçe Halk Kütüphanesi"],
["1294", "ANTALYA Demre İlçe Halk Kütüphanesi"],
["1539", "ANTALYA Döşemealtı Bebek ve Çocuk Kütüphanesi"],
["1577", "ANTALYA Döşemealtı İlçe Halk Kütüphanesi"],
["135", "ANTALYA Elmalı İlçe Halk Kütüphanesi"],
["136", "ANTALYA Finike İlçe Halk Kütüphanesi"],
["677", "ANTALYA Gazipaşa İlçe Halk Kütüphanesi"],
["710", "ANTALYA Gündoğmuş İlçe Halk Kütüphanesi"],
["1520", "Antalya Havalimanı Kütüphanesi"],
["753", "ANTALYA İbradı İlçe Halk Kütüphanesi"],
["809", "ANTALYA Kaş Atatürk İlçe Halk Kütüphanesi"],
["821", "ANTALYA Kemer Hilmiye Serin İlçe Halk Kütüphanesi"],
["137", "ANTALYA Korkuteli Fatih İlçe Halk Kütüphanesi"],
["873", "ANTALYA Kumluca İlçe Halk Kütüphanesi"],
["90", "ANTALYA Manavgat İlçe Halk Kütüphanesi"],
["1541", "ANTALYA Manavgat Side Yağhane Turizm ve Seyahat Kütüphanesi"],
["894", "ANTALYA Manavgat Taşağıl Halk Kütüphanesi"],
["913", "ANTALYA Muratpaşa Ahmet Sönmez İlçe Halk Kütüphanesi"],
["1582", "ANTALYA Muratpaşa Millet Bahçesi Halk Kütüphanesi"],
["138", "ANTALYA Serik İlçe Halk Kütüphanesi"],
["17", "ANTALYA TEKELİOĞLU İL HALK KÜTÜPHANESİ"],
["18", "ARDAHAN İL HALK KÜTÜPHANESİ"],
["1359", "ARDAHAN Çıldır İlçe Halk Kütüphanesi"],
["1353", "ARDAHAN Damal İlçe Halk Kütüphanesi"],
["688", "ARDAHAN Göle İlçe Halk Kütüphanesi"],
["727", "ARDAHAN Hanak 125.Yıl İlçe Halk Kütüphanesi"],
["955", "ARDAHAN Posof İlçe Halk Kütüphanesi"],
["19", "ARTVİN İL HALK KÜTÜPHANESİ"],
["472", "ARTVİN Ardanuç İlçe Halk Kütüphanesi"],
["139", "ARTVİN Arhavi 100. Yıl Nermin Çarmıklı İlçe Halk Kütüphanesi"],
["1432", "ARTVİN Artrium AVM Çocuk Kütüphanesi"],
["1352", "ARTVİN Borçka İlçe Halk Kütüphanesi"],
["745", "ARTVİN Hopa İlçe Halk Kütüphanesi"],
["484", "ARTVİN Merkez Aşağımaden Halk Kütüphanesi"],
["914", "ARTVİN Murgul İlçe Halk Kütüphanesi"],
["1028", "ARTVİN Şavşat İlçe Halk Kütüphanesi"],
["1137", "ARTVİN Yusufeli 100. Yıl İlçe Halk Kütüphanesi"],
["5", "AYDIN İL HALK KÜTÜPHANESİ"],
["490", "AYDIN Atça Halk Kütüphanesi"],
["541", "AYDIN Bozdoğan İlçe Halk Kütüphanesi"],
["1318", "AYDIN Buharkent İlçe Halk Kütüphanesi"],
["140", "AYDIN Çine İlçe Halk Kütüphanesi"],
["1380", "AYDIN Efeler İlçe Halk Kütüphanesi"],
["141", "AYDIN Germencik İlçe Halk Kütüphanesi"],
["142", "AYDIN İncirliova İlçe Halk Kütüphanesi"],
["793", "AYDIN Karacasu İlçe Halk kütüphanesi"],
["283", "AYDIN Karacasu Yenice Halk Kütüphanesi"],
["1350", "AYDIN Karpuzlu İlçe Halk Kütüphanesi"],
["282", "AYDIN Koçarlı İlçe Halk Kütüphanesi"],
["1519", "AYDIN Köşk İlçe Halk Kütüphanesi"],
["143", "AYDIN Kuşadası İlçe Halk Kütüphanesi"],
["284", "AYDIN Kuyucak İlçe Halk Kütüphanesi"],
["1297", "AYDIN Kültür Merkezi Çocuk Kütüphanesi"],
["144", "AYDIN Nazilli İlçe Halk Kütüphanesi"],
["1404", "AYDIN Nazilli Kültür Merkezi Kütüphanesi"],
["932", "AYDIN Ortaklar Halk Kütüphanesi"],
["145", "AYDIN Söke Hacı Halil Paşa İlçe Halk Kütüphanesi"],
["975", "AYDIN Söke Sarıkemer Halk Kütüphanesi"],
["1014", "AYDIN Sultanhisar İlçe Halk Kütüphanesi"],
["1116", "AYDIN Yenipazar İlçe Halk Kütüphanesi"],
["20", "BALIKESİR İL HALK KÜTÜPHANESİ"],
["1148", "BALIKESİR Altıeylül İlçe Halk Kütüphanesi"],
["146", "BALIKESİR Ayvalık İlçe Halk Kütüphanesi"],
["147", "BALIKESİR Bandırma İlçe Halk Kütüphanesi"],
["536", "BALIKESİR Bigadiç İlçe Halk Kütüphanesi"],
["148", "BALIKESİR Burhaniye İlçe Halk Kütüphanesi"],
["1141", "BALIKESİR Dursunbey Bebek ve Çocuk Kütüphanesi"],
["285", "BALIKESİR Dursunbey İlçe Halk Kütüphanesi"],
["440", "BALIKESİR Edremit Akçay İzzet Ege Halk Kütüphanesi"],
["149", "BALIKESİR Edremit İlçe Halk Kütüphanesi"],
["1347", "BALIKESİR Gömeç İlçe Halk Kütüphanesi"],
["150", "BALIKESİR Gönen Ömer Seyfettin İlçe Halk Kütüphanesi"],
["735", "BALIKESİR Havran Erdem Akpınar İlçe Halk Kütüphanesi"],
["775", "BALIKESİR İvrindi İlçe Halk Kütüphanesi"],
["826", "BALIKESİR Kepsut İlçe Halk Kütüphanesi"],
["895", "BALIKESİR Manyas İlçe Halk Kütüphanesi"],
["1489", "BALIKESİR Marmara Adası İlçe Halk Kütüphanesi"],
["1523", "BALIKESİR Marmara Saraylar Halk Kütüphanesi"],
["511", "BALIKESİR Merkez Altıeylül Çocuk Kütüphanesi"],
["512", "BALIKESİR Merkez Atatürk Çocuk Kütüphanesi"],
["513", "BALIKESİR Merkez Ece Amca Çocuk Kütüphanesi"],
["514", "BALIKESİR Merkez Gaziosmanpaşa Halk Kütüphanesi"],
["983", "BALIKESİR Savaştepe İlçe Halk Kütüphanesi"],
["998", "BALIKESİR Sındırgı Piyade Uzman Çavuş Hasan Öztürk İlçe Halk Kütüphanesi"],
["1400", "BALIKESİR Sultan Alparslan Halk Kütüphanesi"],
["1018", "BALIKESİR Susurluk İlçe Halk Kütüphanesi"],
["21", "BARTIN İL HALK KÜTÜPHANESİ"],
["1495", "BARTIN Amasra İlçe Halk Kütüphanesi"],
["408", "BARTIN Kurucaşile İlçe Halk Kütüphanesi"],
["476", "BARTIN Merkez Arıt 75. Yıl Halk Kütüphanesi"],
["3", "BARTIN Ulus Kültür ve Sanatevi"],
["1510", "BATMAN Ahmet Kaya Şube Halk Kütüphanesi"],
["340", "BATMAN Beşiri İlçe Halk Kütüphanesi"],
["1476", "Batman Çocuk Kütüphanesi"],
["341", "BATMAN Gercüş İlçe Halk Kütüphanesi"],
["364", "BATMAN Hasankeyf İlçe Halk Kütüphanesi"],
["860", "BATMAN Kozluk İlçe Halk Kütüphanesi"],
["1559", "BATMAN Merkez Leyla Nasıroğlu Halk Kütüphanesi"],
["1201", "BATMAN Merkez Şube Kütüphanesi"],
["1477", "BATMAN Petrolkent Halk Kütüphanesi"],
["1312", "BATMAN Sason İlçe Halk Kütüphanesi"],
["22", "BATMAN ŞEHİT ŞENAY AYBÜKE YALÇIN İL HALK KÜTÜPHANESİ"],
["1511", "BATMAN Yunus Emre Şube Halk Kütüphanesi"],
["23", "BAYBURT İL HALK KÜTÜPHANESİ"],
["151", "BAYBURT Aydıntepe İlçe Halk Kütüphanesi"],
["610", "BAYBURT Demirözü İlçe Halk Kütüphanesi"],
["24", "BİLECİK İL HALK KÜTÜPHANESİ"],
["105", "BİLECİK Bozüyük İlçe Halk Kütüphanesi"],
["692", "BİLECİK Gölpazarı İlçe Halk Kütüphanesi"],
["1552", "BİLECİK Osmaneli Bebek ve Çocuk Kütüphanesi"],
["934", "BİLECİK Osmaneli İlçe Halk Kütüphanesi"],
["1188", "BİLECİK Pazaryeri İlçe Halk Kütüphanesi"],
["1009", "BİLECİK Söğüt İlçe Halk Kütüphanesi"],
["25", "BİNGÖL YIL İL HALK KÜTÜPHANESİ"],
["423", "BİNGÖL Adaklı İlçe Halk Kütüphanesi"],
["366", "BİNGÖL Genç İlçe Halk Kütüphanesi"],
["807", "BİNGÖL Karlıova İlçe Halk Kütüphanesi"],
["832", "BİNGÖL Kığı İlçe Halk Kütüphanesi"],
["365", "BİNGÖL Solhan İlçe Halk Kütüphanesi"],
["1362", "BİNGÖL Yedisu İlçe Halk Kütüphanesi"],
["26", "BİTLİS İL HALK KÜTÜPHANESİ"],
["349", "BİTLİS Adilcevaz İlçe Halk Kütüphanesi"],
["345", "BİTLİS Ahlat İlçe Halk Kütüphanesi"],
["1367", "BİTLİS Bebek ve Çocuk Kütüphanesi"],
["347", "BİTLİS Güroymak İlçe Halk Kütüphanesi"],
["348", "BİTLİS Hizan İlçe Halk Kütüphanesi"],
["346", "BİTLİS Mutki İlçe Halk Kütüphanesi"],
["153", "BİTLİS Tatvan İlçe Halk Kütüphanesi"],
["27", "BOLU İL HALK KÜTÜPHANESİ"],
["633", "BOLU Dörtdivan İlçe Halk Kütüphanesi"],
["154", "BOLU Gerede İlçe Halk Kütüphanesi"],
["702", "BOLU Göynük İlçe Halk Kütüphanesi"],
["831", "BOLU Kıbrıscık Şehit Kaymakam Muhammed Fatih Safitürk İlçe Halk Kütüphanesi"],
["901", "BOLU Mengen 75.Yıl İlçe Halk Kütüphanesi"],
["912", "BOLU Mudurnu İlçe Halk Kütüphanesi"],
["985", "BOLU Seben İlçe Halk Kütüphanesi"],
["1112", "BOLU Yeniçağa İlçe Halk Kütüphanesi"],
["543", "KASTAMONU Türk Eczacıları Birliği İlçe Halk Kütüphanesi"],
["8", "BURDUR İL HALK KÜTÜPHANESİ"],
["547", "BURDUR Altınyayla İlçe Halk Kütüphanesi"],
["109", "BURDUR Bucak İlçe Halk Kütüphanesi"],
["575", "BURDUR Çavdır İlçe Halk Kütüphanesi"],
["583", "BURDUR Çeltikçi İlçe Halk Kütüphanesi"],
["548", "Burdur Çocuk Kütüphanesi"],
["689", "BURDUR Gölhisar 75.Yıl İlçe Halk Kütüphanesi"],
["799", "BURDUR Karamanlı İlçe Halk Kütüphanesi"],
["822", "BURDUR Kemer İlçe Halk Kütüphanesi"],
["612", "BURDUR Merkez Depremevleri Halk Kütüphanesi"],
["859", "BURDUR Merkez Kozluca Semih Serdar Özveren Halk Kütüphanesi"],
["1050", "BURDUR Tefenni İlçe Halk Kütüphanesi"],
["439", "BURDUR Yeşilova Akçaköy Elif Nine Halk Kütüphanesi"],
["1126", "BURDUR Yeşilova İlçe Halk kütüphanesi"],
["29", "BURSA İL HALK KÜTÜPHANESİ"],
["716", "BURSA Gürsu İlçe Halk Kütüphanesi"],
["286", "BURSA İnegöl Çocuk Kütüphanesi"],
["157", "BURSA İnegöl İshakpaşa İlçe Halk Kütüphanesi"],
["776", "BURSA İznik İlçe Halk Kütüphanesi"],
["792", "BURSA Karacabey 100. Yıl Sadık Yılmaz İlçe Halk Kütüphanesi"],
["1535", "BURSA Karacabey Sütaş Sadık Yılmaz Halk Kütüphanesi"],
["819", "BURSA Keles İlçe Halk Kütüphanesi"],
["830", "BURSA Kestel İlçe Halk Kütüphanesi"],
["911", "BURSA Mudanya İlçe Halk Kütüphanesi"],
["158", "BURSA Mustafakemalpaşa İsmail Hakkı Şenpamukçu İlçe Halk Kütüphanesi"],
["923", "BURSA Nilüfer İlçe Halk Kütüphanesi"],
["928", "BURSA Orhaneli İlçe Halk Kütüphanesi"],
["750", "BURSA Osmangazi Hüsniye Bilsen Halk Kütüphanesi"],
["898", "BURSA Osmangazi Mehmet Ali Deniz Halk Kütüphanesi"],
["939", "BURSA Osmangazi Ömer Mercan Halk Kütüphanesi"],
["1065", "BURSA Osmangazi Tophane Çocuk Kütüphanesi"],
["1372", "BURSA Prof. Dr. Süleyman Uludağ ve Prof. Dr. Mustafa Kara Tasavvuf Kültürü ve Edebiyatı Kütüphanesi"],
["1119", "BURSA Yenişehir Fatma Göztepe İlçe Halk Kütüphanesi"],
["496", "ÇANAKKALE Ayvacık İlçe Halk Kütüphanesi"],
["1281", "ÇANAKKALE Bayramiç İlçe Halk Kütüphanesi"],
["535", "ÇANAKKALE Biga İlçe Halk Kütüphanesi"],
["287", "ÇANAKKALE Bozcaada İlçe Halk Kütüphanesi"],
["367", "ÇANAKKALE Çan İlçe Halk Kütüphanesi"],
["1214", "ÇANAKKALE Eceabat İlçe Halk Kütüphanesi"],
["667", "ÇANAKKALE Ezine İlçe Halk Kütüphanesi"],
["159", "ÇANAKKALE Gelibolu İlçe Halk Kütüphanesi"],
["160", "ÇANAKKALE Gökçeada İlçe Halk Kütüphanesi"],
["409", "ÇANAKKALE Lapseki İlçe Halk Kütüphanesi"],
["1087", "ÇANAKKALE Lapseki Umurbey Halk Kütüphanesi"],
["30", "ÇANAKKALE M.A.ERSOY İL HALK KÜTÜPHANESİ"],
["1283", "ÇANAKKALE Yenice İlçe Halk Kütüphanesi"],
["31", "ÇANKIRI İL HALK KÜTÜPHANESİ"],
["491", "ÇANKIRI Atkaracalar Oğuz İlçe Halk Kütüphanesi"],
["525", "ÇANKIRI Bayramören İlçe Halk Kütüphanesi"],
["587", "ÇANKIRI Çerkeş İlçe Halk Kütüphanesi"],
["368", "ÇANKIRI Eldivan İlçe Halk Kütüphanesi"],
["752", "ÇANKIRI Ilgaz İlçe Halk Kütüphanesi"],
["840", "ÇANKIRI Kızılırmak İlçe Halk Kütüphanesi"],
["854", "ÇANKIRI Korgun 125. Yıl İlçe Halk Kütüphanesi"],
["418", "ÇANKIRI Kurşunlu Osman Ekmekçi İlçe Halk Kütüphanesi"],
["161", "ÇANKIRI Orta İlçe Halk Kütüphanesi"],
["1022", "ÇANKIRI Şabanözü İlçe Halk Kütüphanesi"],
["1105", "ÇANKIRI Yapraklı İlçe Halk Kütüphanesi"],
["1453", "ÇANKIRI Yaylakent Halk Kütüphanesi"],
["32", "ÇORUM İL HALK KÜTÜPHANESİ"],
["452", "ÇORUM Alaca Alacahöyük Halk Kütüphanesi"],
["162", "ÇORUM Alaca İlçe Halk Kütüphanesi"],
["288", "ÇORUM Bayat İlçe Halk Kütüphanesi"],
["539", "ÇORUM Boğazkale 100. Yıl İlçe Halk Kütüphanesi"],
["410", "ÇORUM Dodurga İlçe Halk Kütüphanesi"],
["290", "ÇORUM Eşref Ertekin Halk Kütüphanesi"],
["291", "ÇORUM Faik Tonguç Çocuk Kütüphanesi"],
["163", "Çorum İskilip İlçe Halk Kütüphanesi"],
["721", "ÇORUM Kargı Hacıhamza Halk Kütüphanesi"],
["369", "ÇORUM Kargı Şehit Suat Yaşar İlçe Halk Kütüphanesi"],
["883", "ÇORUM Laçin İlçe Halk Kütüphanesi"],
["289", "ÇORUM Mecitözü İlçe Halk Kütüphanesi"],
["164", "ÇORUM Merkez Hasanpaşa Halk Kütüphanesi"],
["899", "ÇORUM Merkez Mehmet Şadisoğlu Çocuk Kütüphanesi"],
["350", "ÇORUM Oğuzlar İlçe Halk Kütüphanesi"],
["933", "ÇORUM Ortaköy İlçe Halk Kütüphanesi"],
["351", "ÇORUM Osmancık İlçe Halk Kütüphanesi"],
["477", "ÇORUM Sungurlu Arifegazili Halk kütüphanesi"],
["165", "ÇORUM Sungurlu İlçe Halk Kütüphanesi"],
["1080", "ÇORUM Uğurludağ 100. Yıl İlçe Halk Kütüphanesi"],
["110", "DEMO EĞİTİM KÜTÜPHANESİ"],
["1308", "DEMO EĞİTİM KÜTÜPHANESİ-TEST"],
["33", "DENİZLİ YIL İL HALK KÜTÜPHANESİ"],
["605", "DENİZLİ Acıpayam Dedebağ Halk Kütüphanesi"],
["166", "DENİZLİ Acıpayam İlçe Halk Kütüphanesi"],
["818", "DENİZLİ Acıpayam Kelekçi Halk Kütüphanesi"],
["1132", "DENİZLİ Acıpayam Yeşilyuva Halk Kütüphanesi"],
["370", "DENİZLİ Babadağ Osman Nuri Yılmaz İlçe Halk Kütüphanesi"],
["352", "DENİZLİ Baklan İlçe Halk Kütüphanesi"],
["353", "DENİZLİ Bekilli İlçe Halk Kütüphanesi"],
["532", "DENİZLİ Beyağaç İlçe Halk Kütüphanesi"],
["294", "DENİZLİ Bozkurt İlçe Halk Kütüphanesi"],
["1528", "DENİZLİ Bozkurt İnceler Halk Kütüphanesi"],
["167", "DENİZLİ Buldan Ali Haydar Akın İlçe Halk Kütüphanesi"],
["1111", "DENİZLİ Buldan Yenicekent Halk Kütüphanesi"],
["442", "DENİZLİ Çal Akkent Halk Kütüphanesi"],
["168", "DENİZLİ Çal İlçe Halk Kütüphanesi"],
["1581", "DENİZLİ Çameli İlçe Halk Kütüphanesi"],
["354", "DENİZLİ Çardak İlçe Halk Kütüphanesi"],
["169", "DENİZLİ Çivril İlçe Halk Kütüphanesi"],
["292", "DENİZLİ Güney İlçe Halk Kütüphanesi"],
["92", "DENİZLİ Honaz İlçe Halk Kütüphanesi"],
["781", "DENİZLİ Honaz Kaklık Halk Kütüphanesi"],
["295", "DENİZLİ Kale İlçe Halk Kütüphanesi"],
["443", "DENİZLİ Pamukkale Akköy Şehit Veli Öztürk Halk Kütüphanesi"],
["293", "DENİZLİ Sarayköy İlçe Halk Kütüphanesi"],
["170", "DENİZLİ Serinhisar 100. Yıl İlçe Halk Kütüphanesi"],
["1048", "DENİZLİ Tavas İlçe Halk Kütüphanesi"],
["835", "DENİZLİ Tavas Kızılca Halk Kütüphanesi"],
["848", "DENİZLİ Tavas Konak Halk Kütüphanesi"],
["1337", " Kütüphanesi"],
["34", "DİYARBAKIR PROF. DR. FUAT SEZGİN İL HALK KÜTÜPHANESİ"],
["1595", "DİYARBAKIR Adalet Halk Kütüphanesi"],
["1185", "DİYARBAKIR Ahmed Arif Edebiyat Müze Kütüphanesi"],
["538", "DİYARBAKIR Bismil İlçe Halk Kütüphanesi"],
["589", "DİYARBAKIR Çermik İlçe Halk Kütüphanesi"],
["591", "DİYARBAKIR Çınar İlçe Halk Kütüphanesi"],
["601", "DİYARBAKIR Çüngüş İlçe Halk Kütüphanesi"],
["619", "DİYARBAKIR Dicle İlçe Halk Kütüphanesi"],
["642", "DİYARBAKIR Eğil İlçe Halk Kütüphanesi"],
["652", "DİYARBAKIR Ergani İlçe Halk Kütüphanesi"],
["1189", "DİYARBAKIR Esma Ocak Çocuk Kütüphanesi"],
["728", "DİYARBAKIR Hani İlçe Halk Kütüphanesi"],
["739", "DİYARBAKIR Hazro İlçe Halk Kütüphanesi"],
["1564", "DİYARBAKIR Kayapınar İlçe Halk Kütüphanesi"],
["845", "DİYARBAKIR Kocaköy İlçe Halk Kütüphanesi"],
["868", "DİYARBAKIR Kulp İlçe Halk Kütüphanesi"],
["886", "DİYARBAKIR Lice İlçe Halk Kütüphanesi"],
["1458", "DİYARBAKIR Prof. Dr. Aziz Sancar Bebek ve Çocuk Kütüphanesi"],
["171", "DİYARBAKIR Silvan İlçe Halk Kütüphanesi"],
["1017", "DİYARBAKIR Sur Suriçi Halk Kütüphanesi"],
["1459", "DİYARBAKIR Yenişehir Halk Kütüphanesi"],
["35", "DÜZCE İL HALK KÜTÜPHANESİ"],
["438", "DÜZCE Akçakoca İlçe Halk Kütüphanesi"],
["1408", "Düzce Cumayeri İlçe Halk Kütüphanesi"],
["343", "DÜZCE Çilimli İlçe Halk Kütüphanesi"],
["693", "DÜZCE Gölyaka İlçe Halk Kütüphanesi"],
["1409", "Düzce Gümüşova İlçe Halk Kütüphanesi"],
["1263", "DÜZCE Kaynaşlı İlçe Halk Kütüphanesi"],
["1334", "DÜZCE Merkez Prof. Dr. Necmettin Erbakan Halk Kütüphanesi"],
["172", "DÜZCE Yığılca İlçe Halk Kütüphanesi"],
["36", "EDİRNE İL HALK KÜTÜPHANESİ"],
["649", "EDİRNE Enez İlçe Halk Kütüphanesi"],
["736", "EDİRNE Havsa İlçe Halk Kütüphanesi"],
["767", "EDİRNE İpsala İlçe Halk Kütüphanesi"],
["173", "EDİRNE Keşan İlçe Halk Kütüphanesi"],
["884", "EDİRNE Lalapaşa İlçe Halk Kütüphanesi"],
["426", "EDİRNE Meriç Adasarhanlı Halk Kütüphanesi"],
["777", "EDİRNE Meriç İlçe Halk Kütüphanesi"],
["174", "EDİRNE Merkez Kırkpınar Halk Kütüphanesi"],
["1212", "EDİRNE Süloğlu İlçe Halk Kütüphanesi"],
["1092", "EDİRNE Uzunköprü İlçe Halk Kütüphanesi"],
["37", "ELAZIĞ İL HALK KÜTÜPHANESİ"],
["1471", "ELAZIĞ Adalet Halk Kütüphanesi"],
["429", "ELAZIĞ Ağın İlçe Halk Kütüphanesi"],
["1357", "ELAZIĞ Alacakaya İlçe Halk Kütüphanesi"],
["475", "ELAZIĞ Arıcak İlçe Halk Kütüphanesi"],
["175", "ELAZIĞ Baskil İlçe Halk Kütüphanesi"],
["1309", "ELAZIĞ Karakoçan İlçe Halk Kütüphanesi"],
["816", "ELAZIĞ Keban İlçe Halk Kütüphanesi"],
["856", "ELAZIĞ Kovancılar İlçe Halk Kütüphanesi"],
["1255", "ELAZIĞ Nurettin Ardıçoğlu Kültür Merkezi Çocuk ve Gençlik Kütüphanesi"],
["942", "ELAZIĞ Palu Kızılay İlçe Halk Kütüphanesi"],
["1005", "ELAZIĞ Sivrice İlçe Halk Kütüphanesi"],
["38", "ERZİNCAN YIL İL HALK KÜTÜPHANESİ"],
["578", "ERZİNCAN Çayırlı 100. Yıl İlçe Halk Kütüphanesi"],
["657", "ERZİNCAN Fatma Sertbaş Bebek ve Çocuk Kütüphanesi"],
["758", "ERZİNCAN İliç İlçe Halk Kütüphanesi"],
["820", "ERZİNCAN Kemah İlçe Halk Kütüphanesi"],
["372", "ERZİNCAN Kemaliye İlçe Halk Kütüphanesi"],
["458", "ERZİNCAN Merkez Alpar Kılınç Halk Kütüphanesi"],
["1082", "ERZİNCAN Merkez Ulalar Halk Kütüphanesi"],
["371", "ERZİNCAN Otlukbeli İlçe Halk Kütüphanesi"],
["960", "ERZİNCAN Refahiye İlçe Halk Kütüphanesi"],
["1057", "ERZİNCAN Tercan 100. Yıl İlçe Halk Kütüphanesi"],
["464", "ERZİNCAN Tercan Altunkent Halk Kütüphanesi"],
["902", "ERZİNCAN Tercan Mercan Halk Kütüphanesi"],
["1098", "ERZİNCAN Üzümlü İlçe Halk Kütüphanesi"],
["39", "ERZURUM İL HALK KÜTÜPHANESİ"],
["485", "ERZURUM Aşkale İlçe Halk Kütüphanesi"],
["658", "ERZURUM Atatürk Kültür Merkezi Kütüphanesi"],
["498", "ERZURUM Aziziye (Ilıca) İlçe Halk Kütüphanesi"],
["570", "ERZURUM Çat İlçe Halk Kütüphanesi"],
["1235", "Erzurum Çocuk Kütüphanesi"],
["1194", "ERZURUM Erzurumlu Emrah Edebiyat Müze Kütüphanesi"],
["296", "ERZURUM Hınıs İlçe Halk Kütüphanesi"],
["746", "ERZURUM Horasan İlçe Halk Kütüphanesi"],
["297", "ERZURUM İspir İlçe Halk Kütüphanesi"],
["1346", "ERZURUM Karaçoban İlçe Halk Kütüphanesi"],
["805", "ERZURUM Karayazı İlçe Halk Kütüphanesi"],
["862", "ERZURUM Köprüköy İlçe Halk Kütüphanesi"],
["815", "ERZURUM Merkez Kazım Karabekir Halk Kütüphanesi"],
["921", "ERZURUM Narman İlçe Halk Kütüphanesi"],
["926", "ERZURUM Oltu İlçe Halk Kütüphanesi"],
["927", "Erzurum Olur İlçe Halk Kütüphanesi"],
["944", "ERZURUM Pasinler İlçe Halk Kütüphanesi"],
["947", "ERZURUM Pazaryolu İlçe Halk Kütüphanesi"],
["1031", "ERZURUM Şenkaya Şehit Abdulbaki İlçe Halk Kütüphanesi"],
["1055", "ERZURUM Tekman İlçe Halk Kütüphanesi"],
["1068", "ERZURUM Tortum Şehit Piyade Teğmen Ahmet AKTEPE İlçe Halk Kütüphanesi"],
["1091", "ERZURUM Uzundere İlçe Halk Kütüphanesi"],
["40", "ESKİŞEHİR İL HALK KÜTÜPHANESİ"],
["459", "ESKİŞEHİR Alpu İlçe Halk Kütüphanesi"],
["534", "ESKİŞEHİR Beylikova İlçe Halk Kütüphanesi"],
["594", "ESKİŞEHİR Çifteler İlçe Halk Kütüphanesi"],
["766", "ESKİŞEHİR İnönü İlçe Halk Kütüphanesi"],
["889", "ESKİŞEHİR Mahmudiye İlçe Halk Kütüphanesi"],
["906", "ESKİŞEHİR Mihalıçcık Annemin İlçe Halk Kütüphanesi"],
["1191", "ESKİŞEHİR Odunpazarı İlçe Halk Kütüphanesi"],
["996", "ESKİŞEHİR Seyitgazi Dr. Ayhan Onursal İlçe Halk Kütüphanesi"],
["1006", "ESKİŞEHİR Sivrihisar Prof. Dr. Mehmet Kaplan İlçe Halk Kütüphanesi"],
["661", "ESKİŞEHİR Tepebaşı Dumlupınar Çocuk Kütüphanesi"],
["1394", "ESKİŞEHİR Tepebaşı Nata Eskişehir Kütüphanesi (AVM)"],
["41", "GAZİANTEP MÜNİFPAŞA 100. YIL İL HALK KÜTÜPHANESİ"],
["395", "GAZİANTEP Araban İlçe Halk Kütüphanesi"],
["1313", "GAZİANTEP İslahiye Altınüzüm Halk Kütüphanesi"],
["176", "GAZİANTEP İslahiye Aziz-Sabiha Bali İlçe Halk Kütüphanesi"],
["1211", "GAZİANTEP İslahiye Yeşilyurt Halk Kütüphanesi"],
["412", "GAZİANTEP Karkamış İlçe Halk Kütüphanesi"],
["1500", "Gaziantep Mozaik Halk Kütüphanesi"],
["177", "GAZİANTEP Nizip İlçe Halk Kütüphanesi"],
["1086", "GAZİANTEP Nizip Uluyatır Halk Kütüphanesi"],
["924", "GAZİANTEP Nurdağı İlçe Halk Kütüphanesi"],
["411", "GAZİANTEP Oğuzeli İlçe Halk Kütüphanesi"],
["178", "GAZİANTEP Şahinbey İlçe Halk Kütüphanesi"],
["94", "GAZİANTEP Şehitkamil Bilgi Yılı İlçe Halk Kütüphanesi"],
["1106", "GAZİANTEP Yavuzeli İlçe Halk Kütüphanesi"],
["42", "GİRESUN İL HALK KÜTÜPHANESİ"],
["298", "GİRESUN Yıl Halk Kütüphanesi"],
["465", "GİRESUN Alucra Hulusi Tekışık İlçe Halk Kütüphanesi"],
["179", "GİRESUN Bulancak 75.Yıl İlçe Halk Kütüphanesi"],
["1228", "GİRESUN Çanakçı İlçe Halk Kütüphanesi"],
["614", "GİRESUN Dereli İlçe Halk Kütüphanesi"],
["627", "GİRESUN Doğankent İlçe Halk Kütüphanesi"],
["663", "GİRESUN Espiye İlçe Halk Kütüphanesi"],
["666", "GİRESUN Eynesil İlçe Halk Kütüphanesi"],
["698", "GİRESUN Görele İlçe Halk Kütüphanesi"],
["1326", "GİRESUN Güce İlçe Halk Kütüphanesi"],
["180", "GİRESUN Keşap İlçe Halk Kütüphanesi"],
["683", "GİRESUN Merkez Çocuk Kütüphanesi"],
["1571", "GİRESUN Merkez Valilik Halk Kütüphanesi"],
["953", "GİRESUN Piraziz İlçe Halk Kütüphanesi"],
["181", "GİRESUN Şebinkarahisar Hüseyin Hüsnü Tekışık İlçe Halk Kütüphanesi"],
["1060", "GİRESUN Tirebolu Temel Gündoğdu İlçe Halk Kütüphanesi"],
["1101", "GİRESUN Yağlıdere İlçe Halk Kütüphanesi"],
["43", "GÜMÜŞHANE İL HALK KÜTÜPHANESİ"],
["182", "GÜMÜŞHANE Kelkit İlçe Halk Kütüphanesi"],
["1094", "GÜMÜŞHANE Kelkit Ünlüpınar Halk Kütüphanesi"],
["864", "GÜMÜŞHANE Köse İlçe Halk Kütüphanesi"],
["964", "GÜMÜŞHANE Köse Salyazı Halk Kütüphanesi"],
["1217", "GÜMÜŞHANE Kültür Merkezi Şube Kütüphanesi"],
["882", "GÜMÜŞHANE Kürtün İlçe Halk Kütüphanesi"],
["413", "GÜMÜŞHANE Şiran İlçe Halk Kütüphanesi"],
["1069", "GÜMÜŞHANE Torul İlçe Halk Kütüphanesi"],
["44", "HAKKARİ İL HALK KÜTÜPHANESİ"],
["598", "HAKKARİ Çukurca İlçe Halk Kütüphanesi"],
["1589", "HAKKARİ Durankaya Halk Kütüphanesi"],
["1590", "HAKKARİ Esendere Halk Kütüphanesi"],
["1030", "HAKKARİ Şemdinli İlçe Halk Kütüphanesi"],
["1138", "HAKKARİ Yüksekova İlçe Halk Kütüphanesi"],
["461", "HATAY Altınözü İlçe Halk Kütüphanesi"],
["1049", "HATAY Arsuz İlçe Halk Kütüphanesi"],
["527", "HATAY Belen İlçe Halk Kütüphanesi"],
["45", "HATAY CEMİL MERİÇ İL HALK KÜTÜPHANESİ"],
["373", "HATAY Dörtyol İlçe Halk Kütüphanesi"],
["374", "HATAY Dörtyol Kuzuculu Halk Kütüphanesi"],
["1463", "HATAY Dörtyol Özerli Halk Kütüphanesi"],
["1456", "HATAY Edebiyat Müze Kütüphanesi"],
["414", "HATAY Erzin İlçe Halk Kütüphanesi"],
["436", "HATAY Hassa Akbez Halk Kütüphanesi"],
["448", "HATAY Hassa Aktepe Halk Kütüphanesi"],
["473", "HATAY Hassa Ardıçlı Halk Kütüphanesi"],
["734", "HATAY Hassa İlçe Halk Kütüphanesi"],
["183", "HATAY İskenderun İlçe Halk Kütüphanesi"],
["1329", "HATAY İskenderun Teknik Çocuk ve Gençlik Kütüphanesi"],
["1407", "HATAY Kırıkhan Çocuk Kütüphanesi"],
["184", "HATAY Kırıkhan N.Ulviye Civelek İlçe Halk Kütüphanesi"],
["872", "HATAY Kumlu İlçe Halk Kütüphanesi"],
["1124", "HATAY Payas İlçe Halk Kütüphanesi"],
["299", "HATAY Reyhanlı İlçe Halk Kütüphanesi"],
["965", "HATAY Samandağ İlçe Halk Kütüphanesi"],
["1444", "HATAY Vali Rahmi Doğan Halk Kütüphanesi"],
["1108", "HATAY Yayladağı İlçe Halk Kütüphanesi"],
["46", "IĞDIR YIL İL HALK KÜTÜPHANESİ"],
["470", "IĞDIR Aralık İlçe Halk Kütüphanesi"],
["1536", "IĞDIR Karakoyunlu 100. Yıl İlçe Halk Kütüphanesi"],
["1596", "IĞDIR Söğütlü Halk Kütüphanesi"],
["375", "IĞDIR Tuzluca İlçe Halk Kütüphanesi"],
["47", "ISPARTA HALİL HAMİT PAŞA İL HALK KÜTÜPHANESİ"],
["1550", "ISPARTA Akkent Halk Kütüphanesi"],
["301", "ISPARTA Aksu İlçe Halk Kütüphanesi"],
["486", "ISPARTA Atabey İslamköy Halk Kütüphanesi"],
["487", "ISPARTA Atabey Mahmut Kıyıcı İlçe Halk Kütüphanesi"],
["1548", "ISPARTA Davraz Halk Kütüphanesi"],
["643", "ISPARTA Eğirdir Barla Halk Kütüphanesi"],
["302", "ISPARTA Eğirdir İlçe Halk Kütüphanesi"],
["679", "ISPARTA Gelendost Bağıllı Aytekin Yılmaz Halk Kütüphanesi"],
["300", "ISPARTA Gelendost Hüseyin Avni Paşa İlçe Halk Kütüphanesi"],
["1102", "ISPARTA Gelendost Yaka Halk Kütüphanesi"],
["694", "ISPARTA Gönen Güneykent Halk Kütüphanesi"],
["695", "ISPARTA Gönen Şehit Öğretmen Selahattin Aysan İlçe Halk Kütüphanesi"],
["817", "ISPARTA Keçiborlu İlçe Halk Kütüphanesi"],
["991", "ISPARTA Keçiborlu Senir Halk Kütüphanesi"],
["1469", "ISPARTA Kültür Merkezi Halk Kütüphanesi"],
["1220", "ISPARTA Merkez Çocuk Kütüphanesi"],
["705", "ISPARTA Merkez Gülistan 75.Yıl Halk Kütüphanesi"],
["659", "ISPARTA Senirkent Esendere (Büyükkabaca) Halk Kütüphanesi"],
["303", "ISPARTA Senirkent İlçe Halk Kütüphanesi"],
["829", "ISPARTA Sütçüler Kesme Halk Kütüphanesi"],
["1021", "ISPARTA Sütçüler Yakup Üstün İlçe Halk Kütüphanesi"],
["568", "ISPARTA Şarkikaraağaç Çarıksaraylar Halk Kütüphanesi"],
["592", "ISPARTA Şarkikaraağaç Çiçekpınar Halk Kütüphanesi"],
["685", "ISPARTA Şarkikaraağaç Göksöğüt Halk Kütüphanesi"],
["185", "ISPARTA Şarkikaraağaç İlçe Halk Kütüphanesi"],
["186", "ISPARTA Uluborlu Alaaddin Keykubat Halk Kütüphanesi"],
["1549", "ISPARTA Vatan Halk Kütüphanesi"],
["502", "Isparta Yalvaç Bağkonak Halk Kütüphanesi"],
["187", "ISPARTA Yalvaç Hacı Ali Rıza Efendi İlçe Halk Kütüphanesi"],
["871", "ISPARTA Yalvaç Kumdanlı Halk Kütüphanesi"],
["1061", "ISPARTA Yalvaç Tokmacık Halk Kütüphanesi"],
["1117", "ISPARTA Yenişarbademli İlçe Halk Kütüphanesi"],
["48", "İSTANBUL ORHAN KEMAL İL HALK KÜTÜPHANESİ"],
["425", "İSTANBUL Adalar Büyükada Halk Kütüphanesi"],
["742", "İSTANBUL Adalar Heybeliada Halk Kütüphanesi"],
["1480", "İSTANBUL Adnan Büyükdeniz Dijital Kütüphanesi"],
["1455", "İSTANBUL AKM Sanat Kütüphanesi (VH)"],
["1452", "İSTANBUL Atatürk Kültür Merkezi Sanat Kütüphanesi"],
["188", "İSTANBUL Avcılar İlçe Halk Kütüphanesi"],
["1517", "İSTANBUL Ayasofya Camii Kütüphanesi"],
["890", "İSTANBUL Bağcılar Mahmutbey Halk Kütüphanesi"],
["1580", "İSTANBUL Bahçelievler İlçe Halk Kütüphanesi"],
["1181", "İSTANBUL Bahçelievler Siyavuşpaşa Çocuk Kütüphanesi"],
["1503", "İSTANBUL Bakırköy Doğan Hızlan Halk Kütüphanesi"],
["95", "İSTANBUL Bakırköy Rıfat Ilgaz İlçe Halk Kütüphanesi"],
["526", "İSTANBUL Bayrampaşa Oğuzhan İlçe Halk Kütüphanesi"],
["91", "İSTANBUL BEYAZIT DEVLET KÜTÜPHANESİ"],
["533", "İSTANBUL Beykoz Kemalettin Tuğcu İlçe Halk Kütüphanesi"],
["1524", "İSTANBUL Büyükada Edebiyat Müze Kütüphanesi"],
["909", "İSTANBUL Büyükçekmece Mimar Sinan Halk Kütüphanesi"],
["572", "İSTANBUL Çatalca İlçe Halk Kütüphanesi"],
["1425", "İSTANBUL Çekmeköy Adnan Menderes Halk Kütüphanesi"],
["1427", "İSTANBUL Çekmeköy Cezeri Halk Kütüphanesi"],
["1426", "İSTANBUL Çekmeköy Evliya Çelebi Halk Kütüphanesi"],
["1485", "İSTANBUL Çekmeköy Farabi Halk Kütüphanesi"],
["1484", "İSTANBUL Çekmeköy Fuat Sezgin Halk Kütüphanesi"],
["1428", "İSTANBUL Çekmeköy Katip Çelebi Halk Kütüphanesi"],
["1424", "İSTANBUL Çekmeköy Piri Reis İlçe Halk Kütüphanesi"],
["1429", "İSTANBUL Çekmeköy Şehit Fatih Mehmethan Halk Kütüphanesi"],
["1481", "İSTANBUL Esenler 15 Temmuz Millet Kütüphanesi"],
["1445", "İSTANBUL Esenler Dr. Kadir Topbaş İlçe Halk Kütüphanesi"],
["1491", "İSTANBUL Esenler Esma Biltaci Bebek ve Çocuk Kütüphanesi"],
["1479", "İSTANBUL Esenler Halk Kütüphanesi"],
["1423", "İSTANBUL Eyüpsultan Ahmet Kekeç İlçe Halk Kütüphanesi"],
["1374", "İstanbul Fatih Abdi Çelebi Kütüphanesi"],
["1187", "İSTANBUL Fatih Ahmet Hamdi Tanpınar Edebiyat Müze Kütüphanesi"],
["1433", "İSTANBUL Fatih Cerrahpaşa Halk Kütüphanesi"],
["1544", "İSTANBUL Fatih Daruşşafaka Kütüphanesi"],
["1376", "İSTANBUL Fatih Dervişali Kütüphanesi"],
["1379", "İSTANBUL Fatih Kadırga Kütüphanesi"],
["1377", "İSTANBUL Fatih Kalenderhane Kütüphanesi"],
["1406", "İSTANBUL Fatih Karagümrük Kütüphanesi"],
["1405", "İSTANBUL Fatih Kasım Günani Kütüphanesi"],
["1434", "İSTANBUL Fatih Merkez Halk Kütüphanesi"],
["355", "İSTANBUL Fatih Refik Halit Karay İlçe Halk Kütüphanesi"],
["1545", "İSTANBUL Fatih Silivrikapı Çocuk Kütüphanesi"],
["1468", "İSTANBUL Fatih Sümbül Efendi Çocuk Kütüphanesi"],
["1378", "İSTANBUL Fatih Topkapı Kütüphanesi"],
["1375", "İSTANBUL Fatih Vani Dergahı Kütüphanesi"],
["1501", "İSTANBUL Fatih Vatan Kütüphanesi"],
["1348", "İSTANBUL Gaziosmanpaşa Çocuk Kütüphanesi"],
["1490", "İSTANBUL Gaziosmanpaşa Farika Halk Kütüphanesi"],
["676", "İSTANBUL Gaziosmanpaşa İlçe Halk Kütüphanesi"],
["192", "İSTANBUL Güngören İlçe Halk Kütüphanesi"],
["1364", "İstanbul Havalimanı Kütüphanesi"],
["111", "İSTANBUL Kadıköy Aziz Berker İlçe Halk Kütüphanesi"],
["376", "İSTANBUL Kadıköy Bostancı Serap Sedat Çocuk Kütüphanesi"],
["1592", "İSTANBUL Kadıköy Ömer Faruk Toprak Halk Kütüphanesi"],
["1419", "İSTANBUL Kağıthane Axis AVM Kütüphanesi"],
["558", "İSTANBUL Kağıthane Çağlayan Halk Kütüphanesi"],
["195", "İSTANBUL Kağıthane Mehmet Akif Ersoy İlçe Halk Kütüphanesi"],
["196", "İSTANBUL Kartal 17 Nisan Halk Kütüphanesi"],
["93", "İSTANBUL Kartal İlçe Halk Kütüphanesi"],
["1594", "İSTANBUL Küçükçekmece Halkalı Halk Kütüphanesi"],
["880", "İSTANBUL Küçükçekmece İlçe Halk Kütüphanesi"],
["193", "İSTANBUL Küçükçekmece Sefaköy Halk Kütüphanesi"],
["194", "İSTANBUL Maltepe Adalet Halk Kütüphanesi"],
["1144", "İSTANBUL Maltepe İlçe Halk Kütüphanesi"],
["112", "İSTANBUL Pendik İlçe Halk Kütüphanesi"],
["1340", "İSTANBUL Prof. Dr. Fuat Sezgin ve Dr. Ursula Sezgin Bilimler Tarihi Kütüphanesi"],
["1497", "İSTANBUL RAMİ KÜTÜPHANESİ"],
["1420", "İSTANBUL Sancaktepe Rings AVM Kütüphanesi"],
["190", "İSTANBUL Seyrantepe Halk Kütüphanesi"],
["1538", "İSTANBUL Silivri Barış Manço Çocuk Kütüphanesi"],
["1560", "İSTANBUL Silivri Büyükçavuşlu Kütüphanesi"],
["1561", "İSTANBUL Silivri Hüseyin Nihal Atsız Kütüphanesi"],
["198", "İSTANBUL Silivri İlçe Halk Kütüphanesi"],
["1525", "İSTANBUL Silivri Marmara Adalet Halk Kütüphanesi"],
["1392", "İSTANBUL Silivri Nata Silivri Kütüphanesi (AVM)"],
["1543", "İSTANBUL Silivri Ömer Seyfettin Kütüphanesi"],
["1411", "İSTANBUL Sinema Müzesi Kütüphanesi"],
["1327", "İSTANBUL Sultanbeyli İlçe Halk Kütüphanesi"],
["1393", "İSTANBUL Sultangazi Nata İstanbul Kütüphanesi (AVM)"],
["1035", "İSTANBUL Şile İlçe Halk Kütüphanesi"],
["1448", "İSTANBUL Tuzla Çocuk Kütüphanesi"],
["1472", "İSTANBUL Tuzla İlçe Halk Kütüphanesi"],
["1403", "İSTANBUL Ümraniye Akyaka Park AVM Kütüphanesi"],
["1486", "İSTANBUL Ümraniye İlçe Halk Kütüphanesi"],
["1487", "İSTANBUL Ümraniye Osmangazi Korusu Halk Kütüphanesi"],
["1095", "İSTANBUL Üsküdar Çinili Çocuk Kütüphanesi"],
["278", "İSTANBUL Üsküdar Mihrimah Sultan Çocuk Kütüphanesi"],
["200", "İSTANBUL Üsküdar Selimiye Çocuk Kütüphanesi"],
["9", "İSTANBUL Üsküdar Şemsi Paşa İlçe Halk Kütüphanesi"],
["415", "İSTANBUL Zeytinburnu İlçe Halk Kütüphanesi"],
["4", "İZMİR ATATÜRK İL HALK KÜTÜPHANESİ"],
["1482", "İZMİR Aliağa Adalet Kütüphanesi"],
["304", "İZMİR Aliağa İlçe Halk Kütüphanesi"],
["1518", "İZMİR Alsancak Halk Kütüphanesi"],
["1547", "İZMİR Alsancak Türk Musikisi İhtisas Kütüphanesi"],
["396", "İZMİR Balçova İlçe Halk Kütüphanesi"],
["522", "İZMİR Bayındır İlçe Halk Kütüphanesi"],
["524", "İZMİR Bayraklı Alpaslan İlçe Halk Kütüphanesi"],
["529", "İZMİR Bergama İlçe Halk Kütüphanesi"],
["305", "İZMİR Beydağ İlçe Halk Kütüphanesi"],
["201", "İZMİR Bornova İlçe Halk Kütüphanesi"],
["416", "İZMİR Bornova Mehmet Akif Ersoy Çocuk Kütüphanesi"],
["1474", "İZMİR Buca Adalet Halk Kütüphanesi"],
["546", "İZMİR Buca İlçe Halk Kütüphanesi"],
["1036", "İZMİR Buca Osman Nuri Saygın Şirinyer Halk Kütüphanesi"],
["590", "İZMİR Çeşme İlçe Halk Kütüphanesi"],
["377", "İZMİR Çiğli İlçe Halk Kütüphanesi"],
["565", "İZMİR Dikili Çandarlı Halk Kütüphanesi"],
["397", "İZMİR Dikili İlçe Halk Kütüphanesi"],
["1373", "İZMİR Edebiyat Müze Kütüphanesi"],
["97", "İZMİR Foça İlçe Halk Kütüphanesi"],
["378", "İZMİR Gaziemir İlçe Halk Kütüphanesi"],
["791", "İZMİR Karabağlar İlçe Halk Kütüphanesi"],
["1216", "İZMİR Karaburun İlçe Halk Kütüphanesi"],
["910", "İZMİR Karaburun Mordoğan Halk Kütüphanesi"],
["808", "İZMİR Karşıyaka Çocuk Kütüphanesi"],
["202", "İZMİR Karşıyaka Hoca Mithat İlçe Halk Kütüphanesi"],
["203", "İZMİR Kemalpaşa İlçe Halk Kütüphanesi"],
["307", "İZMİR Kınık Halk Kütüphanesi"],
["842", "İZMİR Kiraz İlçe Halk Kütüphanesi"],
["1431", "İZMİR Menderes İlçe Halk Kütüphanesi"],
["900", "İZMİR Menemen İlçe Halk Kütüphanesi"],
["997", "İZMİR Menemen Seyrek Halk Kütüphanesi"],
["920", "İZMİR Narlıdere İlçe Halk Kütüphanesi"],
["937", "İZMİR Ödemiş Bademli Halk Kütüphanesi"],
["938", "İZMİR Ödemiş İlçe Halk Kütüphanesi"],
["811", "İZMİR Ödemiş Kaymakçı Halk Kütüphanesi"],
["850", "İZMİR Ödemiş Konaklı Halk Kütüphanesi"],
["1396", "İZMİR Seferihisar Şehit Kara Pilot Üsteğmen Aykut Yurtsever İlçe Halk Kütüphanesi"],
["306", "İZMİR Selçuk İlçe Halk Kütüphanesi"],
["1059", "İZMİR Tire Ahmet Munis Armağan İlçe Halk Kütüphanesi"],
["1066", "İZMİR Torbalı İlçe Halk Kütüphanesi"],
["500", "İZMİR Urla Bademler Halk Kütüphanesi"],
["1301", "İZMİR Urla İlçe Halk Kütüphanesi"],
["49", "KAHRAMANMARAŞ KARACAOĞLAN İL HALK KÜTÜPHANESİ"],
["427", "KAHRAMANMARAŞ Afşin İlçe Halk Kütüphanesi"],
["466", "KAHRAMANMARAŞ Andırın Şehit Astsubay Ömer Halisdemir İlçe Halk Kütüphanesi"],
["637", "KAHRAMANMARAŞ Çağlayancerit Düzbağ Halk Kütüphanesi"],
["780", "Kahramanmaraş Çocuk Kütüphanesi"],
["1179", "KAHRAMANMARAŞ Ekinözü İlçe Halk Kütüphanesi"],
["313", "KAHRAMANMARAŞ Elbistan İlçe Halk Kütüphanesi"],
["686", "KAHRAMANMARAŞ Göksun İlçe Halk Kütüphanesi"],
["669", "KAHRAMANMARAŞ Merkez Fatih Halk Kütüphanesi"],
["925", "KAHRAMANMARAŞ Nurhak İlçe Halk Kütüphanesi"],
["945", "KAHRAMANMARAŞ Pazarcık İlçe Halk Kütüphanesi"],
["1587", "Kahramanmaraş Şiir Kütüphanesi"],
["1077", "KAHRAMANMARAŞ Türkoğlu İlçe Halk Kütüphanesi"],
["915", "KAHRAMANMARAŞ Türkoğlu Mustafa Okumuş Halk Kütüphanesi"],
["1127", "KAHRAMANMARAŞ Türkoğlu Yeşilyöre Halk Kütüphanesi"],
["1586", "KAHRAMANMARAŞ Yedi Güzel Adam Halk Kütüphanesi"],
["50", "KARABÜK İL HALK KÜTÜPHANESİ"],
["640", "KARABÜK Eflani İlçe Halk Kütüphanesi"],
["358", "KARABÜK Eskipazar İlçe Halk Kütüphanesi"],
["1209", "KARABÜK Kültür Merkezi Halk Kütüphanesi"],
["342", "KARABÜK Ovacık İlçe Halk Kütüphanesi"],
["205", "KARABÜK Safranbolu İlçe Halk Kütüphanesi"],
["935", "KARABÜK Safranbolu Ovacuma Halk Kütüphanesi"],
["379", "KARABÜK Yenice İlçe Halk Kütüphanesi"],
["51", "KARAMAN KARAMANOĞLU MEHMET BEY İL HALK KÜTÜPHANESİ"],
["495", "KARAMAN Ayrancı İlçe Halk Kütüphanesi"],
["655", "KARAMAN Ermenek Mustafa ve Ayşe Karpuzcu İlçe Halk Kütüphanesi"],
["339", "KARAMAN Kazım Karabekir İlçe Halk Kütüphanesi"],
["433", "KARAMAN Merkez Ahmet Altınay Çocuk Kütüphanesi"],
["813", "KARAMAN Merkez Kayserilioğlu Bebek ve Çocuk Kütüphanesi"],
["1554", "KARAMAN Piri Reis 100. Yıl Halk Kütüphanesi"],
["979", "KARAMAN Sarıveliler Şair Ahmet Tufan Şentürk İlçe Halk Kütüphanesi"],
["52", "KARS İL HALK KÜTÜPHANESİ"],
["1488", "KARS Akyaka İlçe Halk Kütüphanesi"],
["1349", "KARS Arpaçay İlçe Halk Kütüphanesi"],
["362", "KARS Atatürk Çocuk Kütüphanesi"],
["620", "KARS Digor İlçe Halk Kütüphanesi"],
["779", "KARS Kağızman İlçe Halk Kütüphanesi"],
["206", "KARS Sarıkamış İlçe Halk Kütüphanesi"],
["989", "KARS Selim İlçe Halk Kütüphanesi"],
["1019", "KARS Susuz Halit Paşa İlçe Halk Kütüphanesi"],
["53", "KASTAMONU YIL İL HALK KÜTÜPHANESİ"],
["420", "KASTAMONU Abana İlçe Halk Kütüphanesi"],
["431", "KASTAMONU Ağlı İlçe Halk Kütüphanesi"],
["468", "KASTAMONU Araç İlçe Halk Kütüphanesi"],
["497", "KASTAMONU Azdavay İlçe Halk Kütüphanesi"],
["555", "KASTAMONU Cide İlçe Halk Kütüphanesi"],
["573", "KASTAMONU Çatalzeytin İlçe Halk Kütüphanesi"],
["602", "KASTAMONU Daday İlçe Halk Kütüphanesi"],
["618", "KASTAMONU Devrekani İlçe Halk Kütüphanesi"],
["1415", "Kastamonu Doğanyurt İlçe Halk Kütüphanesi"],
["1244", "KASTAMONU Hanönü İlçe Halk Kütüphanesi"],
["764", "KASTAMONU İnebolu İlçe Halk Kütüphanesi"],
["1417", "Kastamonu Küre İlçe Halk Kütüphanesi"],
["1416", "Kastamonu Pınarbaşı İlçe Halk Kütüphanesi"],
["993", "KASTAMONU Seydiler Şehit Şerife Bacı İlçe Halk Kütüphanesi"],
["1032", "Kastamonu Şenpazar İlçe Halk Kütüphanesi"],
["1043", "KASTAMONU Taşköprü İlçe Halk Kütüphanesi"],
["207", "KASTAMONU Tosya İlçe Halk Kütüphanesi"],
["54", "KAYSERİ İL HALK KÜTÜPHANESİ"],
["430", "KAYSERİ Akkışla İlçe Halk Kütüphanesi"],
["1441", "KAYSERİ Bünyan Adalet Halk Kütüphanesi"],
["550", "KAYSERİ Bünyan İlçe Halk Kütüphanesi"],
["208", "KAYSERİ Develi Seyrani İlçe Halk Kütüphanesi"],
["1158", "KAYSERİ Felahiye İlçe Halk Kütüphanesi"],
["1174", "KAYSERİ Hacılar İlçe Halk Kütüphanesi"],
["762", "KAYSERİ İncesu İlçe Halk Kütüphanesi"],
["1584", "KAYSERİ Kocasinan Ahi Evran Halk Kütüphanesi"],
["1389", "KAYSERİ Kocasinan Argıncık Halk Kütüphanesi"],
["1387", "KAYSERİ Kocasinan Beyazşehir Halk Kütüphanesi"],
["1527", "KAYSERİ Kocasinan Fevzi Çakmak Halk Kütüphanesi"],
["654", "KAYSERİ Kocasinan İlçe Halk Kütüphanesi"],
["1196", "KAYSERİ Kocasinan Necmettin Feyzioğlu Halk Kütüphanesi"],
["1526", "KAYSERİ Kocasinan Yenişehir Halk Kütüphanesi"],
["1388", "KAYSERİ Kocasinan Ziya Gökalp Halk Kütüphanesi"],
["1198", "KAYSERİ Melikgazi Hisarcık Halk Kütüphanesi"],
["1473", "KAYSERİ Melikgazi İlçe Halk Kütüphanesi"],
["1197", "KAYSERİ Melikgazi Mimarsinan Selçuklu Halk Kütüphanesi"],
["1208", "KAYSERİ Özvatan İlçe Halk Kütüphanesi"],
["951", "KAYSERİ Pınarbaşı İlçe Halk Kütüphanesi"],
["1172", "KAYSERİ Pınarbaşı Pazarören Halk Kütüphanesi"],
["978", "KAYSERİ Sarıoğlan 80.Yıl İlçe Halk Kütüphanesi"],
["981", "KAYSERİ Sarız İlçe Halk Kütüphanesi"],
["1038", "KAYSERİ Talas Fatma-Kemal Timuçin Halk Kütüphanesi"],
["1402", "KAYSERİ Talas İlçe Halk Kütüphanesi"],
["1062", "KAYSERİ Tomarza İlçe Halk Kütüphanesi"],
["398", "KAYSERİ Yahyalı İlçe Halk Kütüphanesi"],
["1173", "KAYSERİ Yeşilhisar İlçe Halk Kütüphanesi"],
["55", "KIRIKKALE İL HALK KÜTÜPHANESİ"],
["509", "KIRIKKALE Bahşılı İlçe Halk Kütüphanesi"],
["515", "KIRIKKALE Balışeyh İlçe Halk Kütüphanesi"],
["846", "KIRIKKALE Balışeyh Koçubaba Halk Kütüphanesi"],
["581", "KIRIKKALE Çelebi İlçe Halk Kütüphanesi"],
["551", "KIRIKKALE Delice Büyükavşar Halk Kütüphanesi"],
["586", "KIRIKKALE Delice Çerikli Halk Kütüphanesi"],
["606", "KIRIKKALE Delice Doğan Gökkaya İlçe Halk Kütüphanesi"],
["1478", "Kırıkkale Ehlibeyt Kütüphanesi"],
["797", "KIRIKKALE Karakeçili İlçe Halk Kütüphanesi"],
["828", "KIRIKKALE Keskin İlçe Halk Kütüphanesi"],
["731", "KIRIKKALE Merkez Hasandede Halk Kütüphanesi"],
["1012", "KIRIKKALE Sulakyurt İlçe Halk Kütüphanesi"],
["380", "KIRIKKALE Yahşihan İlçe Halk Kütüphanesi"],
["1371", "KIRIKKALE Yenimahalle Halk Kütüphanesi"],
["56", "KIRKLARELİ İL HALK KÜTÜPHANESİ"],
["460", "KIRKLARELİ Babaeski Alpullu Halk Kütüphanesi"],
["209", "KIRKLARELİ Babaeski Görkey İlçe Halk Kütüphanesi"],
["1446", "KIRKLARELİ Demirköy İlçe Halk Kütüphanesi"],
["434", "KIRKLARELİ Lüleburgaz Ahmetbey Halk Kütüphanesi"],
["553", "KIRKLARELİ Lüleburgaz Büyükkarıştıran Halk Kütüphanesi"],
["665", "KIRKLARELİ Lüleburgaz Evrensekiz Halk Kütüphanesi"],
["210", "KIRKLARELİ Lüleburgaz Sokullu Mehmet Paşa İlçe Halk Kütüphanesi"],
["765", "KIRKLARELİ Merkez İnece Halk Kütüphanesi"],
["948", "KIRKLARELİ Pehlivanköy İlçe Halk Kütüphanesi"],
["309", "KIRKLARELİ Pınarhisar İlçe Halk Kütüphanesi"],
["1097", "KIRKLARELİ Vize İlçe Halk Kütüphanesi"],
["57", "KIRŞEHİR AŞIK PAŞA İL HALK KÜTÜPHANESİ"],
["1370", "KIRŞEHİR Akçakent İlçe Halk Kütüphanesi"],
["310", "KIRŞEHİR Akpınar İlçe Halk Kütüphanesi"],
["1164", "KIRŞEHİR Boztepe İlçe Halk Kütüphanesi"],
["1167", "KIRŞEHİR Çiçekdağı İlçe Halk Kütüphanesi"],
["211", "KIRŞEHİR Kaman İlçe Halk Kütüphanesi"],
["875", "KIRŞEHİR Kaman Kurancılı Halk Kütüphanesi"],
["940", "KIRŞEHİR Kaman Ömerhacılı Halk Kütüphanesi"],
["432", "KIRŞEHİR Merkez Ahi Evran Halk Kütüphanesi"],
["212", "KIRŞEHİR Mucur İlçe Halk Kütüphanesi"],
["1182", "KİLİS İL HALK KÜTÜPHANESİ"],
["1319", "KİLİS Elbeyli İlçe Halk Kütüphanesi"],
["841", "KİLİS Merkez Bebek ve Çocuk Kütüphanesi"],
["1521", "KİLİS Musabeyli İlçe Halk Kütüphanesi"],
["59", "KOCAELİ İL HALK KÜTÜPHANESİ"],
["1466", "KOCAELİ Çayırova Akse Halk Kütüphanesi"],
["1278", "KOCAELİ Çayırova İlçe Halk Kütüphanesi"],
["615", "KOCAELİ Derince M. Kılıçdoğan İlçe Halk Kütüphanesi"],
["1506", "KOCAELİ Dilovası Köseler Halk Kütüphanesi"],
["1504", "KOCAELİ Dilovası Orhangazi Halk Kütüphanesi"],
["1505", "KOCAELİ Dilovası Turgut Özal Halk Kütüphanesi"],
["213", "KOCAELİ Gebze İlçe Halk Kütüphanesi"],
["214", "KOCAELİ Gölcük İlçe Halk Kütüphanesi"],
["1502", "KOCAELİ Kandıra Adalet Halk Kütüphanesi"],
["787", "KOCAELİ Kandıra Prof. Turan Güneş İlçe Halk Kütüphanesi"],
["215", "KOCAELİ Karamürsel İlçe Halk Kütüphanesi"],
["1010", "KOCAELİ Kartepe İlçe Halk Kütüphanesi"],
["863", "KOCAELİ Körfez Prof. Dr. Ahmet Haluk Dursun İlçe Halk Kütüphanesi"],
["866", "KOCAELİ Merkez Köseköy Nazım Demirci Halk Kütüphanesi"],
["844", "KOCAELİ Merkez Nazmi Oğuz Çocuk Kütüphanesi"],
["216", "KOCAELİ Merkez Zübeyde Hanım Halk Kütüphanesi"],
["60", "KONYA İL HALK KÜTÜPHANESİ"],
["748", "KONYA Ahırlı Halk Kütüphanesi"],
["1529", "KONYA Akören İlçe Halk Kütüphanesi"],
["629", "KONYA Akşehir Doğrugöz Halk Kütüphanesi"],
["217", "KONYA Akşehir Tarık Buğra İlçe Halk Kütüphanesi"],
["1341", "KONYA Altınekin İlçe Halk Kütüphanesi"],
["625", "KONYA Beyşehir Doğanbey Halk Kütüphanesi"],
["218", "KONYA Beyşehir İlçe Halk Kütüphanesi"],
["1114", "KONYA Beyşehir Yenidoğan Halk Kütüphanesi"],
["1157", "KONYA Bozkır İlçe Halk Kütüphanesi"],
["556", "KONYA Cihanbeyli 75.Yıl İlçe Halk Kütüphanesi"],
["582", "KONYA Çeltik İlçe Halk Kütüphanesi"],
["600", "KONYA Çumra Alibeyhüyüğü Halk Kütüphanesi"],
["754", "KONYA Çumra İçeriçumra Halk Kütüphanesi"],
["219", "KONYA Çumra İlçe Halk Kütüphanesi"],
["806", "KONYA Çumra Karkın Halk Kütüphanesi"],
["613", "KONYA Derbent İlçe Halk Kütüphanesi"],
["626", "KONYA Doğanhisar İlçe Halk Kütüphanesi"],
["648", "KONYA Emirgazi İlçe Halk Kütüphanesi"],
["220", "KONYA Ereğli İzzettin Süllü İlçe Halk Kütüphanesi"],
["1336", "KONYA Ereğli Sümer Çocuk Kütüphanesi"],
["1150", "KONYA Güneysınır İlçe Halk Kütüphanesi"],
["722", "KONYA Hadim İlçe Halk Kütüphanesi"],
["751", "KONYA Hüyük İlçe Halk Kütüphanesi"],
["1514", "KONYA Ilgın Bebek ve Çocuk Kütüphanesi"],
["221", "KONYA Ilgın Dr. Vefa Tanır İlçe Halk Kütüphanesi"],
["311", "KONYA Kadınhanı İlçe Halk Kütüphanesi"],
["222", "KONYA Karapınar İlçe Halk Kütüphanesi"],
["803", "KONYA Karatay İlçe Halk Kütüphanesi"],
["869", "KONYA Kulu İlçe Halk Kütüphanesi"],
["1358", "KONYA Meram Gar Kütüphanesi"],
["1413", "KONYA Meram İlçe Halk Kütüphanesi"],
["381", "KONYA Sarayönü İlçe Halk Kütüphanesi"],
["988", "KONYA Selçuklu İlçe Halk Kütüphanesi"],
["223", "KONYA Seydişehir İlçe Halk Kütüphanesi"],
["994", "KONYA Seydişehir Ortakaraören Halk Kütüphanesi"],
["492", "KONYA Taşkent Avşar Halk Kütüphanesi"],
["1039", "KONYA Taşkent İlçe Halk Kütüphanesi"],
["1075", "KONYA Tuzlukçu İlçe Halk Kütüphanesi"],
["1207", "KONYA Yalıhüyük İlçe Halk Kütüphanesi"],
["1136", "KONYA Yunak 100. Yıl Atatürk İlçe Halk Kütüphanesi"],
["7", "KÜTAHYA İL HALK KÜTÜPHANESİ"],
["224", "KÜTAHYA Altıntaş İlçe Halk Kütüphanesi"],
["483", "KÜTAHYA Aslanapa İlçe Halk Kütüphanesi"],
["574", "KÜTAHYA Çavdarhisar İlçe Halk Kütüphanesi"],
["631", "KÜTAHYA Domaniç İlçe Halk Kütüphanesi"],
["635", "KÜTAHYA Dumlupınar İlçe Halk Kütüphanesi"],
["646", "KÜTAHYA Emet Gülten-Cevdet Dayıoğlu İlçe Halk Kütüphanesi"],
["678", "KÜTAHYA Gediz İlçe Halk Kütüphanesi"],
["225", "KÜTAHYA Hisarcık İlçe Halk Kütüphanesi"],
["227", "KÜTAHYA Merkez 100.Yıl Çocuk Kütüphanesi"],
["1224", "KÜTAHYA Merkez Evliya Çelebi Edebiyat Müze Kütüphanesi"],
["226", "KÜTAHYA Merkez Seyit Ömer 75. Yıl Halk Kütüphanesi"],
["946", "KÜTAHYA Pazarlar İlçe Halk Kütüphanesi"],
["1566", "KÜTAHYA Simav Bebek Kütüphanesi"],
["597", "KÜTAHYA Simav Çitgöl Hüseyin Efendi Halk Kütüphanesi"],
["878", "KÜTAHYA Simav Güney Halk Kütüphanesi"],
["98", "KÜTAHYA Simav İlçe Halk Kütüphanesi"],
["228", "KÜTAHYA Şaphane İlçe Halk Kütüphanesi"],
["1072", "KÜTAHYA Tavşanlı Tunçbilek Halk Kütüphanesi"],
["229", "KÜTAHYA Tavşanlı Zeytinoğlu İlçe Halk Kütüphanesi"],
["61", "MALATYA YIL İL HALK KÜTÜPHANESİ"],
["437", "MALATYA Akçadağ İlçe Halk Kütüphanesi"],
["471", "MALATYA Arapgir Fethi Gemuhluoğlu İlçe Halk Kütüphanesi"],
["474", "MALATYA Arguvan İlçe Halk Kütüphanesi"],
["520", "MALATYA Battalgazi İlçe Halk Kütüphanesi"],
["230", "MALATYA Darende Sadrazam Mehmet Paşa İlçe Halk Kütüphanesi"],
["653", "MALATYA Doğanşehir Erkenek Halk Kütüphanesi"],
["312", "MALATYA Doğanşehir İlçe Halk Kütüphanesi"],
["954", "MALATYA Doğanşehir Polat Halk Kütüphanesi"],
["720", "MALATYA Hekimhan Güzelyurt Halk Kütüphanesi"],
["740", "MALATYA Hekimhan İlçe Halk Kütüphanesi"],
["783", "MALATYA Kale İlçe Halk Kütüphanesi"],
["870", "MALATYA Kuluncak İlçe Halk Kütüphanesi"],
["1107", "MALATYA MalatyaPark AVM Kütüphanesi"],
["622", "MALATYA Merkez Dilek Halk Kütüphanesi"],
["849", "MALATYA Merkez Konak Halk Kütüphanesi"],
["891", "MALATYA Merkez Sabancı Kültür Sitesi Halk Kütüphanesi"],
["1240", "MALATYA Merkez Sadreddin Konevi Halk Kütüphanesi"],
["958", "MALATYA Pütürge İlçe Halk Kütüphanesi"],
["1109", "MALATYA Yazıhan İlçe Halk Kütüphanesi"],
["1130", "MALATYA Yeşilyurt İlçe Halk Kütüphanesi"],
["62", "MANİSA İL HALK KÜTÜPHANESİ"],
["435", "MANİSA Ahmetli İlçe Halk Kütüphanesi"],
["231", "MANİSA Akhisar Zeynelzade İlçe Halk Kütüphanesi"],
["457", "MANİSA Alaşehir İlçe Halk Kütüphanesi"],
["608", "MANİSA Demirci 50. Yıl Çocuk Kütüphanesi"],
["609", "MANİSA Demirci İlçe Halk Kütüphanesi"],
["1533", "MANİSA Gölmarmara İlçe Halk Kütüphanesi"],
["696", "MANİSA Gördes M. Nail Akçiçek İlçe Halk Kütüphanesi"],
["833", "MANİSA Kırkağaç İlçe Halk Kütüphanesi"],
["861", "MANİSA Köprübaşı İlçe Halk Kütüphanesi"],
["867", "MANİSA Kula İlçe Halk Kütüphanesi"],
["908", "MANİSA Merkez Mimar Sinan Çocuk Kütüphanesi"],
["424", "MANİSA Salihli Adala Halk Kütüphanesi"],
["104", "MANİSA Salihli İlçe Halk Kütüphanesi"],
["972", "MANİSA Sarıgöl İlçe Halk Kütüphanesi"],
["982", "MANİSA Saruhanlı Dr. İbrahim Türek İlçe Halk Kütüphanesi"],
["1149", "MANİSA Selendi ilçe Halk Kütüphanesi"],
["1008", "MANİSA Soma İlçe Halk Kütüphanesi"],
["769", "MANİSA Şehzadeler Dr. İbrahim Türek Çocuk Kütüphanesi"],
["1551", "MANİSA Turgutlu Bebek ve Çocuk Kütüphanesi"],
["232", "MANİSA Turgutlu İlçe Halk Kütüphanesi"],
["447", "MANİSA Yunusemre İlçe Halk Kütüphanesi"],
["63", "MARDİN İL HALK KÜTÜPHANESİ"],
["1516", "MARDİN Dargeçit 100. Yıl İlçe Halk Kütüphanesi"],
["314", "MARDİN Derik İlçe Halk Kütüphanesi"],
["315", "MARDİN Kızıltepe İlçe Halk Kütüphanesi"],
["1546", "MARDİN Mazıdağı 100. Yıl İlçe Halk Kütüphanesi"],
["318", "MARDİN Midyat Altunkaya İlçe Halk Kütüphanesi"],
["1565", "MARDİN Midyat Bebek ve Çocuk Kütüphanesi"],
["1553", "MARDİN Midyat Millet Bahçesi Halk Kütüphanesi"],
["316", "MARDİN Nusaybin İlçe Halk Kütüphanesi"],
["317", "MARDİN Ömerli İlçe Halk Kütüphanesi"],
["984", "MARDİN Savur İlçe Halk Kütüphanesi"],
["1125", "MARDİN Yeşilli İlçe Halk Kütüphanesi"],
["64", "MERSİN İL HALK KÜTÜPHANESİ"],
["749", "MERSİN Akdeniz Huzurkent Halk Kütüphanesi"],
["903", "MERSİN Akdeniz Merkez Çocuk Kütüphanesi"],
["567", "MERSİN Anamur Çarıklar Halk kütüphanesi"],
["1247", "MERSİN Anamur Gençlik ve Çocuk Kütüphanesi"],
["233", "MERSİN Anamur İlçe Halk Kütüphanesi"],
["494", "MERSİN Aydıncık İlçe Halk Kütüphanesi"],
["545", "MERSİN Bozyazı İlçe Halk Kütüphanesi"],
["668", "MERSİN Çamlıyayla Fakılar Halk Kütüphanesi"],
["383", "MERSİN Çamlıyayla İlçe Halk Kütüphanesi"],
["234", "MERSİN Erdemli İlçe Halk Kütüphanesi"],
["382", "MERSİN Gülnar İlçe Halk Kütüphanesi"],
["851", "MERSİN Gülnar Konur Halk Kütüphanesi"],
["865", "MERSİN Gülnar Köseçobanlı Halk Kütüphanesi"],
["877", "MERSİN Gülnar Kuskan Halk Kütüphanesi"],
["673", "MERSİN Mezitli Fındıkpınarı Halk Kütüphanesi"],
["905", "MERSİN Mezitli İlçe (Kuyuluk) Halk Kütüphanesi"],
["917", "MERSİN Mut İlçe Halk Kütüphanesi"],
["235", "MERSİN Silifke İlçe Halk Kütüphanesi"],
["236", "MERSİN Tarsus İlçe Halk Kütüphanesi"],
["839", "MERSİN Tarsus Kızılçukur Halk Kütüphanesi"],
["1110", "MERSİN Tarsus Yenice Halk Kütüphanesi"],
["480", "MERSİN Toroslar Arslanköy Halk Kütüphanesi"],
["1067", "MERSİN Toroslar İlçe Halk Kütüphanesi"],
["1440", " KÜTÜPHANE"],
["11", "MUĞLA HOCA MUSTAFA EFENDİ İL HALK KÜTÜPHANESİ"],
["6", "MUĞLA Bodrum İlçe Halk Kütüphanesi"],
["603", "MUĞLA Dalaman İlçe Halk Kütüphanesi"],
["237", "MUĞLA Datça İlçe Halk Kütüphanesi"],
["238", "MUĞLA Fethiye İlçe Halk Kütüphanesi"],
["1443", "MUĞLA Kavaklıdere İlçe Halk Kütüphanesi"],
["239", "MUĞLA Köyceğiz 75.Yıl İlçe Halk Kütüphanesi"],
["240", "MUĞLA Marmaris İlçe Halk Kütüphanesi"],
["1206", "MUĞLA Menteşe Şehbal Hilmi Şerif Baydur Çocuk Kütüphanesi"],
["1120", "MUĞLA Menteşe Yerkesik Halk Kütüphanesi"],
["241", "MUĞLA Milas İlçe Halk Kütüphanesi"],
["930", "MUĞLA Ortaca İlçe Halk Kütüphanesi"],
["1335", "MUĞLA Seydikemer İlçe Halk Kütüphanesi"],
["1081", "MUĞLA Ula İlçe Halk Kütüphanesi"],
["1532", "MUĞLA Yatağan İlçe Halk Kütüphanesi"],
["65", "MUŞ İL HALK KÜTÜPHANESİ"],
["319", "MUŞ Bulanık İlçe Halk Kütüphanesi"],
["1180", "MUŞ Bulanık Uzgörür Halk Kütüphanesi"],
["1184", "Muş Çocuk Kütüphanesi"],
["1288", "MUŞ Hasköy İlçe Halk Kütüphanesi"],
["855", "MUŞ Korkut İlçe Halk Kütüphanesi"],
["892", "MUŞ Malazgirt İlçe Halk Kütüphanesi"],
["356", "MUŞ Varto İlçe Halk Kütüphanesi"],
["66", "NEVŞEHİR İL HALK KÜTÜPHANESİ"],
["422", "NEVŞEHİR Acıgöl İlçe Halk Kütüphanesi"],
["801", "NEVŞEHİR Acıgöl Karapınar Halk Kütüphanesi"],
["1047", "NEVŞEHİR Acıgöl Tatlarin Halk Kütüphanesi"],
["552", "NEVŞEHİR Avanos Büyükayhan Halk Kütüphanesi"],
["701", "NEVŞEHİR Avanos Göynük Halk Kütüphanesi"],
["242", "NEVŞEHİR Avanos İlçe Halk Kütüphanesi"],
["782", "NEVŞEHİR Avanos Kalaba Halk Kütüphanesi"],
["941", "NEVŞEHİR Avanos Özkonak Halk Kütüphanesi"],
["977", "NEVŞEHİR Avanos Sarılar Halk Kütüphanesi"],
["1064", "NEVŞEHİR Avanos Topaklı HalkKütüphanesi"],
["1513", "NEVŞEHİR Bebek ve Çocuk Kütüphanesi"],
["1285", "NEVŞEHİR Derinkuyu İlçe Halk Kütüphanesi"],
["708", "NEVŞEHİR Gülşehir Gümüşkent Halk Kütüphanesi"],
["794", "NEVŞEHİR Gülşehir Karacaşar Kara Halil Paşa Halk Kütüphanesi"],
["243", "NEVŞEHİR Gülşehir Karavezir İlçe Halk Kütüphanesi"],
["1169", "NEVŞEHİR Hacıbektaş Avuçköyü Halk Kütüphanesi"],
["244", "NEVŞEHİR Hacıbektaş İlçe Halk Kütüphanesi"],
["1170", "NEVŞEHİR Hacıbektaş Kızılağıl Halk Kütüphanesi"],
["1171", "NEVŞEHİR Hacıbektaş Köşektaş Halk Kütüphanesi"],
["1156", "NEVŞEHİR Kozaklı İlçe Halk Kütüphanesi"],
["1159", "NEVŞEHİR Kozaklı Karahasanlı Halk Kütüphanesi"],
["1160", "NEVŞEHİR Kozaklı Karasenir Halk Kütüphanesi"],
["569", "NEVŞEHİR Merkez Çat Halk Kütüphanesi"],
["245", "NEVŞEHİR Merkez Damat ibrahim Paşa Halk Kütüphanesi"],
["697", "NEVŞEHİR Merkez Göre Halk Kütüphanesi"],
["699", "NEVŞEHİR Merkez Göreme Halk Kütüphanesi"],
["812", "NEVŞEHİR Merkez Kaymaklı Halk Kütüphanesi"],
["919", "NEVŞEHİR Merkez Nar Hacı Osman Ağa Halk Kütüphanesi"],
["1078", "NEVŞEHİR Merkez Uçhisar Halk Kütüphanesi"],
["1494", "NEVŞEHİR Paşa Konağı Halk Kütüphanesi"],
["1177", "NEVŞEHİR Ürgüp Başdere Halk Kütüphanesi"],
["916", "NEVŞEHİR Ürgüp Mustafapaşa Halk Kütüphanesi"],
["931", "NEVŞEHİR Ürgüp Ortahisar Halk Kütüphanesi"],
["973", "NEVŞEHİR Ürgüp Sarıhıdır Halk Kütüphanesi"],
["1023", "NEVŞEHİR Ürgüp Şahinefendi Halk Kütüphanesi"],
["246", "NEVŞEHİR Ürgüp Tahsinağa İlçe Halk Kütüphanesi"],
["1040", "NEVŞEHİR Ürgüp Taşkınpaşa Halk Kütüphanesi"],
["67", "NİĞDE İL HALK KÜTÜPHANESİ"],
["463", "NİĞDE Altunhisar İlçe Halk Kütüphanesi"],
["506", "NİĞDE Bor Bahçeli Halk Kütüphanesi"],
["599", "NİĞDE Bor Çukurkuyu Halk Kütüphanesi"],
["247", "NİĞDE Bor Halil Nuri Bey İlçe Halk Kütüphanesi"],
["823", "NİĞDE Bor Kemerhisar Halk Kütüphanesi"],
["836", "NİĞDE Bor Kızılca Halk Kütüphanesi"],
["562", "NİĞDE Çamardı İlçe Halk Kütüphanesi"],
["595", "NİĞDE Çiftlik İlçe Halk Kütüphanesi"],
["1537", "NİĞDE Kale 100. Yıl Halk Kütüphanesi"],
["1508", "NİĞDE Kayabaşı Halk Kütüphanesi"],
["503", "NİĞDE Merkez Bağlama Halk Kütüphanesi"],
["636", "NİĞDE Merkez Dündarlı Halk Kütüphanesi"],
["671", "NİĞDE Merkez Fertek Hüseyin Avni Göktürk Halk Kütüphanesi"],
["709", "NİĞDE Merkez Gümüşler Halk Kütüphanesi"],
["858", "NİĞDE Merkez Koyunlu Halk Kütüphanesi"],
["593", "NİĞDE Ulukışla Çiftehan Halk Kütüphanesi"],
["1085", "NİĞDE Ulukışla İlçe Halk Kütüphanesi"],
["68", "ORDU GAZİ İL HALK KÜTÜPHANESİ"],
["444", "ORDU Akkuş Mesude Efil İlçe Halk Kütüphanesi"],
["1314", "ORDU Altınordu İlçe Halk Kütüphanesi"],
["322", "ORDU Aybastı İlçe Halk Kütüphanesi"],
["563", "ORDU Çamaş İlçe Halk Kütütphanesi"],
["1315", "ORDU Çatalpınar İlçe Halk Kütüphanesi"],
["321", "ORDU Çaybaşı İlçe Halk Kütüphanesi"],
["1365", "Ordu Çocuk Kütüphanesi"],
["107", "ORDU Fatsa İlçe Halk Kütüphanesi"],
["690", "ORDU Gölköy Mehmet Akif Ersoy İlçe Halk Kütüphanesi"],
["707", "ORDU Gülyalı Güzide G. Taranoğlu İlçe Halk Kütüphanesi"],
["714", "ORDU Gürgentepe İlçe Halk Kütüphanesi"],
["757", "ORDU İkizce İlçe Halk Kütüphanesi"],
["1369", "ORDU Kabadüz İlçe Halk Kütüphanesi"],
["455", "ORDU Kabataş Alankent Halk Kütüphanesi"],
["1311", "ORDU Kabataş İlçe Halk Kütüphanesi"],
["853", "ORDU Korgan İlçe Halk Kütüphanesi"],
["1344", "ORDU Korgan Tepealan Halk Kütüphanesi"],
["874", "ORDU Kumru İlçe Halk Kütüphanesi"],
["904", "ORDU Mesudiye İlçe Halk Kütüphanesi"],
["1122", "ORDU Mesudiye Yeşilce Halk Kütüphanesi"],
["384", "ORDU Perşembe İlçe Halk Kütüphanesi"],
["1464", "ORDU Ulu Cami Halk Kütüphanesi"],
["1084", "ORDU Ulubey İlçe Halk Kütüphanesi"],
["1054", "ORDU Ünye Bebek ve Çocuk Kütüphanesi"],
["248", "ORDU Ünye İlçe Halk Kütüphanesi"],
["1492", "ORDU Ünye Uniport AVM Halk Kütüphanesi"],
["69", "OSMANİYE EMİNE KESKİNER İL HALK KÜTÜPHANESİ"],
["505", "OSMANİYE Bahçe İlçe Halk Kütüphanesi"],
["1585", "OSMANİYE Devlet Hastanesi Halk Kütüphanesi"],
["385", "OSMANİYE Düziçi İlçe Halk Kütüphanesi"],
["730", "OSMANİYE Hasanbeyli İlçe Halk Kütüphanesi"],
["778", "OSMANİYE Kadirli İlçe Halk Kütüphanesi"],
["1574", "OSMANİYE Merkez Fakıuşağı Halk Kütüphanesi"],
["1330", "OSMANİYE Merkez Tosyalı Halk Kütüphanesi"],
["1016", "OSMANİYE Sumbas İlçe Halk Kütüphanesi"],
["386", "OSMANİYE Toprakkale İlçe Halk Kütüphanesi"],
["70", "RİZE İL HALK KÜTÜPHANESİ"],
["249", "RİZE Ardeşen İlçe Halk Kütüphanesi"],
["323", "RİZE Çamlıhemşin İlçe Halk Kütüphanesi"],
["324", "RİZE Çayeli İlçe Halk Kütüphanesi"],
["888", "RİZE Çayeli Madenli Halk Kütüphanesi"],
["325", "RİZE Derepazarı İlçe Halk Kütüphanesi"],
["328", "RİZE Fındıklı İlçe Halk Kütüphanesi"],
["713", "RİZE Güneysu İlçe Halk Kütüphanesi"],
["741", "RİZE Hemşin İlçe Halk Kütüphanesi"],
["711", "RİZE İkizdere İlçe Halk Kütüphanesi"],
["326", "RİZE İyidere İlçe Halk Kütüphanesi"],
["786", "RİZE Kalkandere İlçe Halk Kütüphanesi"],
["881", "RİZE Merkez Kültür Merkezi Halk Kütüphanesi"],
["1099", "RİZE Merkez Veliköy Halk Kütüphanesi"],
["1041", "RİZE Muradiye Osman Efendioğlu Halk Kütüphanesi"],
["327", "RİZE Pazar İlçe Halk Kütüphanesi"],
["71", "SAKARYA İL HALK KÜTÜPHANESİ"],
["1576", "SAKARYA Adalet Halk Kütüphanesi"],
["330", "SAKARYA Akyazı Mehmet Niyazi Özdemir İlçe Halk Kütüphanesi"],
["1583", "SAKARYA Arifiye İlçe Halk Kütüphanesi"],
["1462", "SAKARYA Ferizli İlçe Halk Kütüphanesi"],
["331", "SAKARYA Geyve İlçe Halk Kütüphanesi"],
["250", "SAKARYA Hendek Atatürk İlçe Halk Kütüphanesi"],
["1499", "SAKARYA Hendek Rasim Paşa Halk Kütüphanesi"],
["1418", "SAKARYA Karapürçek İlçe Halk Kütüphanesi"],
["332", "SAKARYA Karasu İlçe Halk Kütüphanesi"],
["1339", "SAKARYA Kaynarca İlçe Halk Kütüphanesi"],
["399", "SAKARYA Kemalettin Samipaşa Halk Kütüphanesi"],
["843", "SAKARYA Kocaali İlçe Halk Kütüphanesi"],
["943", "SAKARYA Pamukova İlçe Halk Kütüphanesi"],
["329", "SAKARYA Sapanca İlçe Halk Kütüphanesi"],
["333", "SAKARYA Söğütlü İlçe Halk Kütüphanesi"],
["1454", "SAKARYA Taraklı İlçe Halk Kütüphanesi"],
["1498", "SAKARYA Yenikent Şeyh Edebali Halk Kütüphanesi"],
["72", "SAMSUN GAZİ İL HALK KÜTÜPHANESİ"],
["400", "SAMSUN Mayıs İlçe Halk Kütüphanesi"],
["453", "SAMSUN Alaçam İlçe Halk Kütüphanesi"],
["482", "SAMSUN Asarcık Şehit Muharrem Konu İlçe Halk Kütüphanesi"],
["488", "SAMSUN Atakum 100. Yıl Gazi İlçe Halk Kütüphanesi"],
["1447", "SAMSUN Ayvacık İlçe Halk Kütüphanesi"],
["251", "SAMSUN Bafra Hasan Çakın İlçe Halk Kütüphanesi"],
["252", "SAMSUN Çarşamba İlçe Halk Kütüphanesi (AVM)"],
["737", "SAMSUN Havza Atatürk İlçe Halk Kütüphanesi"],
["254", "SAMSUN İlkadım Atatürk İlçe Halk Kütüphanesi"],
["810", "SAMSUN Kavak İlçe Halk Kütüphanesi"],
["253", "SAMSUN Ladik Atatürk İlçe Halk Kütüphanesi"],
["1542", "SAMSUN Müzesi Halk Kütüphanesi"],
["963", "SAMSUN Salıpazarı İlçe Halk Kütüphanesi"],
["1053", "SAMSUN Tekkeköy İlçe Halk Kütüphanesi"],
["1058", "SAMSUN Terme İlçe Halk Kütüphanesi"],
["1522", "SAMSUN Vezirköprü Bebek ve Çocuk Kütüphanesi"],
["1333", "SAMSUN Vezirköprü Çocuk Kütüphanesi"],
["255", "SAMSUN Vezirköprü Fazıl Ahmet Paşa İlçe Halk Kütüphanesi"],
["1493", "SAMSUN Yakakent İlçe Halk Kütüphanesi"],
["73", "SİİRT İL HALK KÜTÜPHANESİ"],
["523", "SİİRT Baykan İlçe Halk Kütüphanesi"],
["656", "SİİRT Eruh İlçe Halk Kütüphanesi"],
["1572", "SİİRT İbrahim Hakkı Halk Kütüphanesi"],
["876", "SİİRT Kurtalan İlçe Halk Kütüphanesi"],
["1360", "SİİRT Merkez 23 Nisan Çocuk Kütüphanesi"],
["950", "SİİRT Pervari İlçe Halk Kütüphanesi"],
["1414", "SİİRT Şirvan İlçe Halk Kütüphanesi"],
["74", "SİNOP DR. RIZA NUR İL HALK KÜTÜPHANESİ"],
["256", "SİNOP Ayancık İlçe Halk Kütüphanesi"],
["257", "SİNOP Boyabat Y.K. Tengirşenk İlçe Halk Kütüphanesi"],
["621", "SİNOP Dikmen İlçe Halk Kütüphanesi"],
["334", "SİNOP Durağan İlçe Halk Kütüphanesi"],
["1162", "SİNOP Erfelek İlçe Halk Kütüphanesi"],
["1322", "SİNOP Gerze Atatürk Halk Kütüphanesi"],
["258", "SİNOP Gerze Münevver Arslan İlçe Halk Kütüphanesi"],
["1591", "SİNOP Kültür Merkezi Halk Kütüphanesi"],
["970", "SİNOP Saraydüzü İlçe Halk Kütüphanesi"],
["1076", "SİNOP Türkeli İlçe Halk Kütüphanesi"],
["75", "SİVAS İL HALK KÜTÜPHANESİ"],
["441", "SİVAS Akıncılar İlçe Halk Kütüphanesi"],
["607", "SİVAS Altınyayla Deliilyas Halk Kütüphanesi"],
["462", "SİVAS Altınyayla İlçe Halk Kütüphanesi"],
["623", "SİVAS Divriği İlçe Halk Kütüphanesi"],
["628", "SİVAS Doğanşar İlçe Halk Kütüphanesi"],
["1449", "SİVAS Esentepe Halk Kütüphanesi"],
["585", "SİVAS Gemerek Çepni Halk Kütüphanesi"],
["641", "SİVAS Gemerek Eğerci Halk Kütüphanesi"],
["680", "SİVAS Gemerek İlçe Halk Kütüphanesi"],
["999", "SİVAS Gemerek Sızır Halk Kütüphanesi"],
["1113", "SİVAS Gemerek Yeniçubuk Halk Kütüphanesi"],
["691", "SİVAS Gölova İlçe Halk Kütüphanesi"],
["717", "SİVAS Gürün İlçe Halk Kütüphanesi"],
["1011", "SİVAS Gürün Suçatı Halk Kütüphanesi"],
["723", "SİVAS Hafik İlçe Halk Kütüphanesi"],
["761", "SİVAS İmranlı İlçe Halk Kütüphanesi"],
["451", "SİVAS Kangal Alacahan Halk Kütüphanesi"],
["788", "SİVAS Kangal İlçe Halk Kütüphanesi"],
["857", "SİVAS Koyulhisar İlçe Halk Kütüphanesi"],
["489", "SİVAS Merkez Atatürk Çocuk Kütüphanesi"],
["634", "SİVAS Merkez Dumlupınar Çocuk Kütüphanesi"],
["672", "SİVAS Merkez Fevzipaşa Çocuk Kütüphanesi"],
["1593", "SİVAS Sanayi-i Nefise Mektebi Kütüphanesi"],
["1147", "SİVAS Suşehri İlçe Halk Kütüphanesi"],
["259", "SİVAS Şarkışla İlçe Halk Kütüphanesi"],
["1083", "SİVAS Ulaş İlçe Halk Kütüphanesi"],
["1133", "SİVAS Yıldızeli İlçe Halk Kütüphanesi"],
["1140", "SİVAS Zara İlçe Halk Kütüphanesi"],
["76", "ŞANLIURFA İL HALK KÜTÜPHANESİ"],
["267", "ŞANLIURFA Akçakale İlçe Halk Kütüphanesi"],
["537", "ŞANLIURFA Birecik İlçe Halk Kütüphanesi"],
["544", "ŞANLIURFA Bozova İlçe Halk Kütüphanesi"],
["1332", "ŞANLIURFA Ceylanpınar İlçe Halk Kütüphanesi"],
["1363", "ŞANLIURFA Çocuk ve Gençlik Kütüphanesi"],
["724", "ŞANLIURFA Halfeti İlçe Halk Kütüphanesi"],
["729", "ŞANLIURFA Harran Fikret Otyam İlçe Halk Kütüphanesi"],
["268", "ŞANLIURFA Hilvan İlçe Halk Kütüphanesi"],
["269", "ŞANLIURFA Siverek İlçe Halk Kütüphanesi"],
["270", "ŞANLIURFA Suruç İlçe Halk Kütüphanesi"],
["271", "ŞANLIURFA Viranşehir İlçe Halk Kütüphanesi"],
["77", "ŞIRNAK İL HALK KÜTÜPHANESİ"],
["1323", "ŞIRNAK Beytüşşebap İlçe Halk Kütüphanesi"],
["1270", "ŞIRNAK Cizre 100. Yıl İlçe Halk Kütüphanesi"],
["1345", "ŞIRNAK Güçlükonak İlçe Halk Kütüphanesi"],
["755", "ŞIRNAK İdil İlçe Halk Kütüphanesi"],
["1000", "ŞIRNAK Silopi İlçe Halk Kütüphanesi"],
["1316", "ŞIRNAK Uludere İlçe Halk Kütüphanesi"],
["78", "TEKİRDAĞ NAMIK KEMAL İL HALK KÜTÜPHANESİ"],
["588", "TEKİRDAĞ Çerkezköy İlçe Halk Kütüphanesi"],
["335", "TEKİRDAĞ Çorlu İlçe Halk Kütüphanesi"],
["1100", "TEKİRDAĞ Ergene İlçe Halk Kütüphanesi"],
["388", "TEKİRDAĞ Hayrabolu İlçe Halk Kütüphanesi"],
["1324", "TEKİRDAĞ Kapaklı İlçe Halk Kütüphanesi"],
["1307", "TEKİRDAĞ Malkara İlçe Halk Kütüphanesi"],
["387", "TEKİRDAĞ Muratlı İlçe Halk Kütüphanesi"],
["968", "TEKİRDAĞ Saray İlçe Halk Kütüphanesi"],
["1027", "TEKİRDAĞ Şarköy İlçe Halk Kütüphanesi"],
["79", "TOKAT İL HALK KÜTÜPHANESİ"],
["389", "TOKAT Almus İlçe Halk Kütüphanesi"],
["481", "TOKAT Artova İlçe Halk Kütüphanesi"],
["519", "TOKAT Başçiftlik İlçe Halk Kütüphanesi"],
["1366", "TOKAT Bebek ve Çocuk Kütüphanesi"],
["650", "TOKAT Erbaa Şehit Said Uslu İlçe Halk Kütüphanesi"],
["261", "TOKAT Niksar İlçe Halk Kütüphanesi"],
["1575", "TOKAT Pazar İlçe Halk Kütüphanesi"],
["733", "TOKAT Reşadiye Hasanşeyh Halk Kütüphanesi"],
["838", "TOKAT Reşadiye Kızılcaören Halk Kütüphanesi"],
["962", "TOKAT Reşadiye Prof. Dr. Nurhan Atasoy İlçe Halk Kütüphanesi"],
["1190", "TOKAT Sulusaray İlçe Halk Kütüphanesi"],
["263", "TOKAT Turhal İlçe Halk Kütüphanesi"],
["1131", "TOKAT Yeşilyurt İlçe Halk Kütüphanesi"],
["718", "TOKAT Zile Güzelbeyli Halk Kütüphanesi"],
["264", "TOKAT Zile İlçe Halk Kütüphanesi"],
["80", "TRABZON İL HALK KÜTÜPHANESİ"],
["265", "TRABZON Akçaabat İlçe Halk Kütüphanesi"],
["469", "TRABZON Araklı İlçe Halk Kütüphanesi"],
["479", "TRABZON Arsin İlçe Halk Kütüphanesi"],
["531", "TRABZON Beşikdüzü İlçe Halk Kütüphanesi"],
["579", "TRABZON Çaykara İlçe Halk Kütüphanesi"],
["1070", "Trabzon Çocuk Kütüphanesi"],
["638", "TRABZON Düzköy İlçe Halk Kütüphanesi"],
["738", "TRABZON Hayrat İlçe Halk Kütüphanesi"],
["887", "TRABZON Maçka İlçe Halk Kütüphanesi"],
["449", "TRABZON Merkez Akyazı Halk Kütüphanesi"],
["1328", "TRABZON Muhibbi Edebiyat Müze Kütüphanesi"],
["390", "TRABZON Of İlçe Halk Kütüphanesi"],
["336", "TRABZON Sürmene 100. Yıl İlçe Halk Kütüphanesi"],
["682", "TRABZON Şalpazarı Geyikli Halk Kütüphanesi"],
["1025", "TRABZON Şalpazarı İlçe Halk Kütüphanesi"],
["1063", "TRABZON Tonya İlçe Halk Kütüphanesi"],
["266", "TRABZON Vakfıkebir İlçe Halk Kütüphanesi"],
["1134", "TRABZON Yomra İlçe Halk Kütüphanesi"],
["81", "TUNCELİ HÜSEYİN GÜNTAŞ İL HALK KÜTÜPHANESİ"],
["584", "TUNCELİ Çemişgezek İlçe Halk Kütüphanesi"],
["747", "TUNCELİ Hozat İlçe Halk Kütüphanesi"],
["896", "TUNCELİ Mazgirt İlçe Halk Kütüphanesi"],
["922", "TUNCELİ Nazimiye İlçe Halk Kütüphanesi"],
["949", "TUNCELİ Pertek İlçe Halk Kütüphanesi"],
["957", "TUNCELİ Pülümür İlçe Halk Kütüphanesi"],
["1205", "UŞAK Atatürk Çocuk Kütüphanesi"],
["554", "UŞAK Banaz Büyükoturak Halk Kütüphanesi"],
["516", "UŞAK Banaz İlçe Halk Kütüphanesi"],
["706", "UŞAK Eşme Güllü Halk Kütüphanesi"],
["664", "UŞAK Eşme İlçe Halk Kütüphanesi"],
["82", "UŞAK İSKENDER PALA İL HALK KÜTÜPHANESİ"],
["391", "UŞAK Karahallı İlçe Halk Kütüphanesi"],
["1090", "UŞAK Merkez Uşak Ragıp Soysal Çocuk Kütüphanesi"],
["1004", "UŞAK Sivaslı İlçe Halk Kütüphanesi"],
["986", "UŞAK Sivaslı Selçikler Halk Kütüphanesi"],
["1046", "UŞAK Sivaslı Tatar Halk Kütüphanesi"],
["337", "UŞAK Ulubey İlçe Halk Kütüphanesi"],
["83", "VAN İL HALK KÜTÜPHANESİ"],
["508", "VAN Bahçesaray Faki-yi Teyran İlçe Halk Kütüphanesi"],
["1279", "VAN Başkale İlçe Halk Kütüphanesi"],
["1579", "VAN Çaldıran Bebek ve Çocuk Kütüphanesi"],
["561", "VAN Çaldıran İlçe Halk Kütüphanesi"],
["571", "VAN Çatak 75.Yıl İlçe Halk Kütüphanesi"],
["639", "VAN Edremit İlçe Halk Kütüphanesi"],
["1578", "VAN Erciş Bebek ve Çocuk Kütüphanesi"],
["651", "VAN Erciş İlçe Halk Kütüphanesi"],
["1457", "VAN Erciş Kültür Merkezi Halk Kütüphanesi"],
["1515", "VAN Fidanlık Halk Kütüphanesi"],
["1368", "VAN Gevaş İlçe Halk Kütüphanesi"],
["715", "VAN Gürpınar İlçe Halk Kütüphanesi"],
["1555", "VAN İpekyolu Bebek ve Çocuk Kütüphanesi"],
["1569", "VAN İpekyolu İlçe Halk Kütüphanesi"],
["1567", "VAN Muradiye Bebek ve Çocuk Kütüphanesi"],
["272", "VAN Muradiye İlçe Halk Kütüphanesi"],
["401", "VAN Özalp İlçe Halk Kütüphanesi"],
["969", "VAN Saray İlçe Halk Kütüphanesi"],
["1556", "VAN Tuşba İlçe Halk Kütüphanesi"],
["84", "YALOVA İL HALK KÜTÜPHANESİ"],
["1331", "YALOVA Altınova İlçe Halk Kütüphanesi"],
["392", "YALOVA Safalı Yılmaz Tüzünataç Çocuk Kütüphanesi"],
["1540", "YALOVA Termal İlçe Halk Kütüphanesi"],
["85", "YOZGAT İL HALK KÜTÜPHANESİ"],
["273", "YOZGAT Akmağdeni İlçe Halk Kütüphanesi"],
["493", "YOZGAT Aydıncık İlçe Halk Kütüphanesi"],
["1088", "YOZGAT Bebek ve Çocuk Kütüphanesi"],
["540", "YOZGAT Boğazlıyan Atatürk İlçe Halk Kütüphanesi"],
["566", "YOZGAT Çandır İlçe Halk Kütüphanesi"],
["577", "YOZGAT Çayıralan İlçe Halk kütüphanesi"],
["580", "YOZGAT Çekerek İlçe Halk Kütüphanesi"],
["976", "YOZGAT Doğankent Halk Kütüphanesi"],
["617", "YOZGAT Kadışehri İlçe Halk Kütüphanesi"],
["971", "YOZGAT Saraykent İlçe Halk Kütüphanesi"],
["974", "YOZGAT Sarıkaya İlçe Halk Kütüphanesi"],
["504", "YOZGAT Sorgun Bahadın Halk Kütüphanesi"],
["596", "YOZGAT Sorgun Çiğdemli Halk Kütüphanesi"],
["274", "YOZGAT Sorgun İlçe Halk Kütüphanesi"],
["275", "YOZGAT Şefaatli Şehit Savaş Akyol İlçe Halk Kütüphanesi Müdürlüğü"],
["1115", "YOZGAT Yenifakılı İlçe Halk Kütüphanesi"],
["1121", "YOZGAT Yerköy İlçe Halk kütüphanesi"],
["966", "YOZGAT Yerköy Saray Halk Kütüphanesi"],
["360", "deneme HALK KÜLTÜRÜ ARAŞTIRMA KÜTÜPHANESİ (AEGM)"],
["359", " TURİZM İHTİSAS KÜTÜPHANESİ (AEGM)"],
["86", "ZONGULDAK İL HALK KÜTÜPHANESİ"],
["456", "ZONGULDAK Alaplı İlçe Halk Kütüphanesi"],
["674", "ZONGULDAK Çaycuma Filyos Halk Kütüphanesi"],
["338", "ZONGULDAK Çaycuma İlçe Halk Kütüphanesi"],
["276", "ZONGULDAK Devrek İlçe Halk Kütüphanesi"],
["89", "ZONGULDAK Ereğli İlçe Halk Kütüphanesi"],
["1512", "ZONGULDAK Gökçebey İlçe Halk Kütüphanesi"],
["1496", "ZONGULDAK Kilimli İlçe Halk Kütüphanesi"],
["1292", "ZONGULDAK Kozlu İlçe Halk Kütüphanesi"]
];
const INITIAL_LOCATIONS = [
    ["AB", "Atatürk Bölümü"],
    ["AÖÖK", "Adnan Ötüken Özel Koleksiyonu"],
    ["BB", "Bebek Bölümü (0-3 Yaş)"],
    ["D", "Depo"],
    ["DB", "Danışma Bölümü"],
    ["DG", "Diğer"],
    ["GB", "Gençlik Bölümü"],
    ["GK", "Gezici Kütüphane"],
    ["IOK", "İlk Okuma Kitapları Bölümü"],
    ["KB", "Kataloglama Bölümü"],
    ["NE", "Nadir Eserler Bölümü"],
    ["S", "Salon"],
    ["SB", "Sanat Bölümü"],
    ["SY", "Süreli Yayınlar Bölümü"],
    ["YB", "Yetişkin Bölümü"],
    ["YDB", "Yabancı Diller Bölümü"],
    ["ÇB", "Çocuk Bölümü"]
];
const WARNING_DEFINITIONS = { 
    invalidStructure: { id: 'invalidStructure', text: 'Yapıya Uygun Olmayan', color: '#E74C3C', sound: 'A#3', message: 'Okutulan barkod gerekli yapıyla eşleşmiyor.' }, 
    locationMismatch: { id: 'locationMismatch', text: 'Konum Farklı', color: '#FAD7A0', sound: 'C4', message: 'Okutulan materyal seçilen lokasyonda bulunmuyor.' }, 
    notLoanable: { id: 'notLoanable', text: 'Ödünç Verilemez', color: '#F08080', sound: 'E5', message: "Materyalin ödünç verilebilirlik durumu uygun değil." }, 
    notInCollection: { id: 'notInCollection', text: 'Düşüm/Devir', color: '#A9C9F5', sound: 'G4', message: 'Materyal koleksiyonda değil (düşüm veya devir yapılmış).' }, 
    onLoan: { id: 'onLoan', text: 'Okuyucuda', color: '#F7B38D', sound: 'C4', message: 'Materyal şu anda ödünçte ve iade edilmesi gerekiyor.' }, 
    wrongLibrary: { id: 'wrongLibrary', text: 'Farklı Kütüphane', color: '#C7AED9', sound: 'C4', message: 'Materyal sizin kütüphanenize ait değil.' }, 
    deleted: { id: 'deleted', text: 'Listede Yok', color: '#808080', sound: 'A3', message: 'Barkod formatı doğru ancak içeri aktarılan listede bulunamadı.' }, 
    autoCompletedNotFound: { id: 'autoCompletedNotFound', text: 'Manuel Girilen Bulunamadı', color: '#8E44AD', sound: 'A3', message: 'Barkod 12 haneye tamamlandı ancak içeri aktardığınız listede bulunamadı. Lütfen materyal barkodunu kontrol edin.' }, 
    duplicate: { id: 'duplicate', text: 'Tekrar Okutuldu', color: '#FFC300', sound: 'B4', message: 'Bu barkod daha önce okutuldu.'} 
};
const PIE_CHART_COLORS = { valid: '#2ECC71', invalid: '#E74C3C', missing: '#95A5A6' };
const ICONS = {
    download: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    writeOff: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m9.5 14.5 5-5"/><path d="m14.5 14.5-5-5"/></svg>,
    missing: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>,
    all: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
    clean: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    wrongLib: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41c.39.39.59.9.59 1.41v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-14a2 2 0 0 1 2-2h7.59c.51 0 1.02.2 1.41.59l4.59 4.59c.39.39.59.9.59 1.41z"/><path d="M12 3v10l-4-2-4 2V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1z"/></svg>,
    location: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
    notLoanable: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    status: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 2.1l4 4-4 4"/><path d="M3 12.6v-2.1c0-2.8 2.2-5 5-5h11"/><path d="M7 21.9l-4-4 4-4"/><path d="M21 11.4v2.1c0 2.8-2.2 5-5 5H5"/></svg>,
    onLoan: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><circle cx="12" cy="8" r="2"/><path d="M15 13a3 3 0 1 0-6 0"/></svg>,
    soundOn: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>,
    soundOff: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="15" y1="9" x2="21" y2="15"/><line x1="21" y1="9" x2="15" y2="15"/></svg>,
    share: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
    install: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/></svg>,
};

// --- Utilities & Components ---
const synth = new Tone.Synth().toDestination();
const CustomTooltip = ({ active, payload, label }) => { if (active && payload && payload.length) { return <div className="bg-white p-2 border border-gray-300 rounded shadow-lg"><p className="font-bold text-slate-800">{label}</p><p className="text-sm text-slate-600">{`Sayı: ${payload[0].value}`}</p></div>; } return null; };
const FileUploader = ({ onFileAccepted, children, title, disabled, accept }) => { const onDrop = useCallback(acceptedFiles => { onFileAccepted(acceptedFiles[0]); }, [onFileAccepted]); const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false, disabled, accept }); return <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${disabled ? 'bg-slate-100 text-slate-400' : 'cursor-pointer'} ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}><input {...getInputProps()} /><p className="text-slate-500">{title}</p>{children}</div>; };
const Modal = ({ isOpen, onClose, children }) => { if (!isOpen) return null; return <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto">{children}</div></div>; };
const WarningModal = ({ isOpen, onClose, title, warnings, barcode }) => { const [isCopied, setIsCopied] = useState(false); const handleCopy = (text) => { const textArea = document.createElement("textarea"); textArea.value = text; textArea.style.position = "fixed"; document.body.appendChild(textArea); textArea.focus(); textArea.select(); try { document.execCommand('copy'); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch (err) { console.error("Panoya kopyalanamadı: ", err); } document.body.removeChild(textArea); }; const onLoanWarning = warnings.find(w => w.id === 'onLoan'); return <Modal isOpen={isOpen} onClose={onClose}><div className="flex justify-between items-center p-4 border-b"><h3 className="text-lg font-bold text-slate-800">{title}</h3><button onClick={onClose} className="text-slate-500 hover:text-slate-800 text-2xl">&times;</button></div><div className="p-5"><ul className="space-y-2 list-disc list-inside">{warnings.map(w => <li key={w.id} style={{color: w.color}} className="font-semibold">{w.message || w.text}</li>)}</ul>{onLoanWarning && barcode && <div className="mt-4 p-3 bg-slate-100 rounded-lg border border-slate-200"><p className="text-sm font-medium text-slate-800">Bu materyali Koha'da iade almak için:</p><a href={`https://personel.ekutuphane.gov.tr/cgi-bin/koha/circ/returns.pl`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold block mt-2 hover:text-blue-800">Koha İade Sayfasına Git</a><p className="text-xs text-slate-500 mt-1">İade sayfasını açtıktan sonra aşağıdaki barkodu yapıştırabilirsiniz.</p><div className="mt-3 flex items-center gap-2"><input type="text" readOnly value={barcode} className="w-full p-2 border bg-slate-200 rounded-md font-mono text-sm" /><button onClick={() => handleCopy(barcode)} className={`px-4 py-2 rounded-md text-white font-semibold transition-colors ${isCopied ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}>{isCopied ? 'Kopyalandı!' : 'Barkodu Kopyala'}</button></div></div>}<button onClick={onClose} className="mt-6 bg-slate-600 text-white py-2 px-4 rounded hover:bg-slate-700 w-full font-bold">Tamam</button></div></Modal>; };
const ConfirmationModal = ({ isOpen, onClose, message, onConfirm }) => { if (!isOpen) return null; const handleConfirm = () => { onConfirm(); onClose(); }; return <Modal isOpen={isOpen} onClose={onClose}><div className="p-6 text-center"><h3 className="text-lg font-medium text-slate-800 mb-4">{message}</h3><div className="flex justify-center gap-4"><button onClick={onClose} className="px-6 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 font-semibold">Hayır</button><button onClick={handleConfirm} className="px-6 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 font-semibold">Evet, Sil</button></div></div></Modal>; };
const AddDataModal = ({ isOpen, onClose, onAdd, type }) => { const [code, setCode] = useState(''); const [name, setName] = useState(''); const handleAdd = () => { if(code && name) { onAdd(type, code, name); onClose(); setCode(''); setName(''); } }; return <Modal isOpen={isOpen} onClose={onClose}><div className="p-5"><h3 className="text-lg font-bold mb-4">Yeni {type === 'library' ? 'Kütüphane' : 'Lokasyon'} Ekle</h3><div className="space-y-4"><input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="Kod" className="w-full p-2 border border-slate-300 rounded-md" /><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="İsim" className="w-full p-2 border border-slate-300 rounded-md" /></div><div className="flex justify-end gap-2 mt-4"><button onClick={onClose} className="px-4 py-2 rounded-md bg-slate-200">İptal</button><button onClick={handleAdd} className="px-4 py-2 rounded-md bg-blue-600 text-white">Ekle</button></div></div></Modal>; };

const FullScreenLoader = ({ text, progress }) => (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex flex-col justify-center items-center p-4">
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center space-x-3">
                <svg className="animate-spin h-8 w-8 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xl text-slate-700 font-semibold">{text}</span>
            </div>
            {progress && (
                <div className="w-full mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                    </div>
                    <p className="text-center text-sm text-slate-600 mt-2">{`${progress.current} / ${progress.total}`}</p>
                </div>
            )}
        </div>
    </div>
);

// --- Permission Screen Component ---
const PermissionScreen = ({ onDecision }) => {
    const [message, setMessage] = useState({ text: '', type: 'none' });
    const [step, setStep] = useState('initial'); // 'initial', 'requesting', 'testing', 'test_success', 'permission_denied'

    const handleDecision = (allow) => {
        localStorage.setItem('cameraPermissionChoiceMade', 'true');
        localStorage.setItem('cameraPermissionStatus', allow ? 'granted' : 'denied');
        onDecision(allow);
    };

    const requestPermission = async () => {
        setStep('requesting'); // Hide initial buttons
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setMessage({ text: '❌ Tarayıcınız kamera erişimini desteklemiyor.', type: 'error' });
            setStep('permission_denied');
            return;
        }
        try {
            // Request permission first
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop()); // Stop stream immediately after getting permission
            setMessage({ text: '✅ İzin verildi. Şimdi kameranızı test edebilirsiniz.', type: 'success' });
            setStep('testing'); // Move to testing step
        } catch (err) {
            console.error("Kamera izni hatası:", err);
            setMessage({ text: '❌ Kamera izni reddedildi. Devam etmek için lütfen tarayıcı ayarlarından izin verin ve sayfayı yenileyin.', type: 'error' });
            setStep('permission_denied');
        }
    };

    const handleCameraTest = async () => {
        try {
             // We already have permission, this is just a quick check
             const stream = await navigator.mediaDevices.getUserMedia({ video: true });
             stream.getTracks().forEach(track => track.stop());
             setMessage({ text: '✅ Kamera testi başarılı, sonraki aşamaya geçiriliyorsunuz...', type: 'success' });
             setStep('test_success');
             setTimeout(() => {
                 handleDecision(true);
             }, 2000);
        } catch(err) {
            setMessage({ text: '❌ Kamera testi başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyin.', type: 'error' });
            setStep('permission_denied'); // Go to a failure state
        }
    };

    const getMessageStyles = (type) => {
        switch (type) {
            case 'success': return 'text-green-600 font-bold';
            case 'error': return 'text-red-600 font-bold';
            default: return 'text-slate-500';
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-100">
            <div className="max-w-lg w-full p-8 bg-white rounded-xl shadow-lg text-center space-y-6">
                <h1 className="text-3xl font-bold text-slate-800">Kamera Erişimi</h1>
                
                {step === 'initial' && (
                    <>
                        <p className="text-slate-600">Sayım için kamerayı kullanmak istiyor musunuz?</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={requestPermission} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                                Evet, Sayım İçin Kamera Kullan
                            </button>
                            <button onClick={() => handleDecision(false)} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 2 20 20"/><path d="M12 12H12.01"/><path d="M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"/><path d="M16.5 16.5 12 21l-4.5-4.5"/><path d="M19 19H5a2 2 0 0 1-2-2V7"/></svg>
                                Hayır, Kamera Kullanmayacağım
                            </button>
                        </div>
                    </>
                )}

                {step === 'testing' && (
                     <>
                        <p className={`text-lg ${getMessageStyles(message.type)}`}>{message.text}</p>
                        <div className="p-4 border border-slate-200 rounded-lg space-y-3">
                            <button onClick={handleCameraTest} className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
                                Kamerayı Test Et
                            </button>
                        </div>
                     </>
                )}
                
                {(step === 'requesting' || step === 'test_success' || step === 'permission_denied') && (
                     <div className={`p-4 border rounded-lg space-y-3 ${message.type === 'success' ? 'border-green-200' : 'border-red-200'}`}>
                        <p className={`mt-2 text-lg ${getMessageStyles(message.type)}`}>{message.text || 'İzin isteniyor...'}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sidebar Component ---
const Sidebar = ({ page, setPage, currentSessionName, selectedLibrary, kohaData, scannedItems, isMuted, setIsMuted, isMobileMenuOpen, setMobileMenuOpen, onShare, onInstall, installPrompt }) => {
    const navItems = [
        { id: 'start', label: 'Yeni Sayım', disabled: false },
        { id: 'pre-reports', label: 'Ön Raporlar', disabled: !currentSessionName || kohaData.length === 0 },
        { id: 'scan', label: 'Sayım', disabled: !selectedLibrary || kohaData.length === 0 },
        { id: 'summary', label: 'Özet & Raporlar', disabled: !selectedLibrary || kohaData.length === 0 || scannedItems.length === 0 }
    ];

    const handleLinkClick = (pageId) => {
        if (navItems.find(item => item.id === pageId)?.disabled) return;
        setPage(pageId);
        setMobileMenuOpen(false);
    };

    return (
        <>
            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                ></div>
            )}
            <aside className={`w-64 bg-white shadow-lg flex flex-col h-screen fixed top-0 left-0 z-40 transition-transform transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-3 flex items-center justify-between border-b border-slate-200">
                     <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                             <h1 className="text-lg font-bold text-slate-800">Koha Sayım Uygulaması</h1>
                             <p className="text-[10px] text-slate-500 leading-tight">(T.C. Kültür ve Turizm Bakanlığı - Kütüphaneler ve Yayımlar Genel Müdürlüğü'ne bağlı kütüphaneler için geliştirilmiştir.)</p>
                        </div>
                    </div>
                    <button className="md:hidden p-1 text-slate-500" onClick={() => setMobileMenuOpen(false)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item, index) => (
                        <button
                            key={item.id}
                            onClick={() => handleLinkClick(item.id)}
                            disabled={item.disabled}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left font-semibold transition-colors ${
                                page === item.id
                                    ? 'bg-slate-700 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-100'
                            } ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${page === item.id ? 'bg-white text-slate-800' : 'bg-slate-200 text-slate-600'}`}>{index + 1}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-200 flex justify-around items-center text-center">
                    <div className="flex flex-col items-center">
                        <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-full text-slate-500 hover:bg-slate-200" title={isMuted ? "Sesi Aç" : "Sesi Kapat"}>
                            {isMuted ? ICONS.soundOff : ICONS.soundOn}
                        </button>
                        <span className="text-xs text-slate-500 mt-1">{isMuted ? "Sesi Aç" : "Sesi Kapat"}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <button onClick={onShare} className="p-2 rounded-full text-slate-500 hover:bg-slate-200" title="Uygulamayı Paylaş">
                            {ICONS.share}
                        </button>
                        <span className="text-xs text-slate-500 mt-1">Paylaş</span>
                    </div>
                    {installPrompt && (
                        <div className="flex flex-col items-center">
                            <button onClick={onInstall} className="p-2 rounded-full text-slate-500 hover:bg-slate-200" title="Uygulamayı Yükle">
                                {ICONS.install}
                            </button>
                            <span className="text-xs text-slate-500 mt-1">Yükle</span>
                        </div>
                    )}
                </div>
                <div className="p-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-2 text-center">
                    <p>Geliştirici: <a href="https://ismailkaraca.com.tr" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700">İsmail KARACA</a></p>
                    <a href="https://www.ismailkaraca.com.tr/sayim.html" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-700 block mt-1">
                        Uygulama kullanımı, teknik dokümantasyon ve sistem mimarisi hakkında daha fazla bilgi için tıklayın.
                    </a>
                    <p className="mt-2 pt-2 border-t border-slate-200">© 2025 Koha Sayım Uygulaması. Tüm hakları saklıdır.</p>
                </div>
            </aside>
        </>
    );
};

const ShareModal = ({ isOpen, onClose }) => {
    const [copySuccess, setCopySuccess] = useState('');
    const shareUrl = window.location.href;
    const shareText = "Koha Sayım Uygulaması'nı keşfedin! Kütüphane sayımlarınızı kolayca yapın: ";

    const shareOptions = [
        { name: 'WhatsApp', url: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + shareUrl)}` },
        { name: 'Telegram', url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` },
        { name: 'X (Twitter)', url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}` },
        { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    ];

    const copyToClipboard = () => {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed"; 
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            setCopySuccess('Bağlantı kopyalandı!');
            setTimeout(() => setCopySuccess(''), 2000);
        } catch (err) {
            setCopySuccess('Kopyalanamadı.');
        }
        document.body.removeChild(textArea);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-5">
                <h3 className="text-lg font-bold mb-4 text-center">Uygulamayı Paylaş</h3>
                <div className="grid grid-cols-2 gap-4">
                    {shareOptions.map(option => (
                        <a key={option.name} href={option.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 p-3 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">
                            <span className="font-semibold text-slate-800">{option.name}</span>
                        </a>
                    ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                    <input type="text" readOnly value={shareUrl} className="w-full p-2 border bg-slate-200 rounded-md font-mono text-sm" />
                    <button onClick={copyToClipboard} className={`px-4 py-2 rounded-md text-white font-semibold transition-colors ${copySuccess ? 'bg-green-500' : 'bg-blue-500 hover:bg-blue-600'}`}>
                        {copySuccess || 'Kopyala'}
                    </button>
                </div>
                 <button onClick={onClose} className="mt-6 bg-slate-600 text-white py-2 px-4 rounded hover:bg-slate-700 w-full font-bold">Kapat</button>
            </div>
        </Modal>
    );
};

const StartScreen = ({ sessions, sessionNameInput, setSessionNameInput, startNewSession, error, setError, loadSession, deleteSession, selectedLibrary, setSelectedLibrary, libraryOptions, setAddDataModal, selectedLocation, setSelectedLocation, locationOptions, kohaData, handleExcelUpload, isXlsxReady, isLoading }) => (
    <div className="w-full">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Hoş Geldiniz</h1>
        <p className="text-slate-600 mb-8">Yeni bir sayım başlatın veya kayıtlı bir oturuma devam edin.</p>
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-slate-700">Yeni Sayım Başlat</h2>
                {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4" role="alert"><p>{error}</p></div>}
                <div className="space-y-4">
                     <input type="text" value={sessionNameInput} onChange={e => {setSessionNameInput(e.target.value); setError('')}} placeholder="Yeni sayım için bir isim girin (örn: Yetişkin Bölümü)" className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
                    <div>
                        <label htmlFor="library-select" className="block text-sm font-medium text-slate-700 mb-1">Kütüphanenizi Seçin</label>
                        <div className="flex gap-2">
                            <select id="library-select" value={selectedLibrary} onChange={(e) => setSelectedLibrary(e.target.value)} className="w-full p-3 border border-slate-300 rounded-md shadow-sm">
                                <option value="">-- Kütüphane Seçiniz --</option>
                                {libraryOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                            </select>
                            <button onClick={()=> setAddDataModal({isOpen: true, type: 'library'})} className="px-3 bg-slate-200 rounded-md hover:bg-slate-300">Yeni Ekle</button>
                        </div>
                         <div className="text-right">
                            <a href="https://www.ismailkaraca.com.tr/kutuphanekod.html" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">Kütüphane Kod ve İsim Listesi için tıklayınız.</a>
                         </div>
                    </div>
                    <div>
                        <label htmlFor="location-select" className="block text-sm font-medium text-slate-700 mb-1">Bölüm/Materyalin Yeri (Opsiyonel)</label>
                        <div className="flex gap-2">
                            <select id="location-select" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full p-3 border border-slate-300 rounded-md shadow-sm">
                                <option value="">-- Tüm Lokasyonlar --</option>
                                {locationOptions.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                            </select>
                            <button onClick={()=> setAddDataModal({isOpen: true, type: 'location'})} className="px-3 bg-slate-200 rounded-md hover:bg-slate-300">Yeni Ekle</button>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Yer seçimi yaparsanız, sayım yaptığınız yerde olmayan materyallerle ilgili uyarı verilecektir.</p>
                        <div className="text-right">
                            <a href="https://www.ismailkaraca.com.tr/bolumkod.html" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">Bölüm Kod ve İsim Listesi için tıklayınız.</a>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="text-sm font-medium text-slate-700">Koha'dan Aldığınız Sayım İçin Hazırlanmış Dosya (.xlsx)</h3>
                           <a href="https://www.ismailkaraca.com.tr/sayimdosyasi.html" target="_blank" rel="noopener noreferrer" className="px-2 py-1 text-xs bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">Sayım için materyal dosyasını indirmek için tıklayınız.</a>
                        </div>
                        <FileUploader onFileAccepted={handleExcelUpload} title={kohaData.length > 0 ? `${kohaData.length} kayıt yüklendi.` : "Dosyayı buraya sürükleyin veya seçmek için tıklayın"} disabled={!isXlsxReady || isLoading} accept={{'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls']}}><svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg></FileUploader>
                    </div>
                    <button onClick={startNewSession} disabled={!sessionNameInput || !selectedLibrary || kohaData.length === 0} className="w-full font-bold py-3 px-4 rounded-md transition-colors bg-green-600 text-white hover:bg-green-700 disabled:bg-slate-400">Sayıma Başla</button>
                </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-2xl font-semibold mb-4 text-slate-700">Kayıtlı Oturumlar</h2>
                {Object.keys(sessions).length > 0 ? <ul className="space-y-3 max-h-60 overflow-y-auto pr-2">{Object.values(sessions).sort((a,b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)).map(session => <li key={session.name} className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-50 rounded-lg border"><div><p className="font-bold text-slate-800">{session.name}</p><p className="text-sm text-slate-500">{new Date(session.lastUpdated).toLocaleString('tr-TR')} - {session.items.length} kayıt</p></div><div className="flex gap-2 mt-2 sm:mt-0"><button onClick={() => loadSession(session.name)} className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">Yükle</button><button onClick={() => deleteSession(session.name)} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">Sil</button></div></li>)}</ul> : <p className="text-slate-500">Kayıtlı oturum bulunamadı.</p>}
            </div>
        </div>
    </div>
);

const ReportCard = ({ report, isXlsxReady }) => (
    <div key={report.id} className="bg-white border border-slate-200 rounded-lg p-4 transition-shadow hover:shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-grow">
                <div className="text-slate-600 flex-shrink-0 w-6 h-6">{report.icon}</div>
                <div>
                    <h4 className="font-bold text-slate-800">{report.title}</h4>
                    <p className="text-sm text-slate-500">Format: {report.format}</p>
                </div>
            </div>
            <div className="flex-shrink-0 mt-2 sm:mt-0">
                <button onClick={report.generator} disabled={!isXlsxReady} className="flex items-center gap-2 bg-slate-700 text-white font-semibold px-4 py-2 rounded-md hover:bg-slate-800 disabled:bg-slate-400 transition-colors">{ICONS.download} İndir</button>
            </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200 text-sm text-slate-600 space-y-2">
            <p>{report.description}</p>
            {report.notes && <ul className="list-disc list-inside text-xs text-slate-500 space-y-1">{report.notes.map((note,i) => <li key={i}>{note}</li>)}</ul>}
            {report.links && <div className="flex flex-col items-start gap-1">{report.links.map((link,i) => <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs">{link.text}</a>)}</div>}
        </div>
    </div>
);


const PreReportsScreen = ({ currentSessionName, error, setPage, preAnalysisReports, isXlsxReady }) => (
    <div className="max-w-3xl mx-auto w-full p-8 bg-white rounded-lg shadow-sm space-y-6 border">
        <h1 className="text-3xl font-bold text-slate-800">Ön Raporlar: "{currentSessionName}"</h1>
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert"><p>{error}</p></div>}
        <button 
            onClick={() => setPage('scan')}
            className="w-full font-bold py-3 px-4 rounded-md transition-colors bg-green-600 text-white hover:bg-green-700"
        >
            Sayıma Devam Et
        </button>
        <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-slate-500 mb-4">Bu raporlar, yüklediğiniz dosyaya göre oluşturulmuştur ve sayım işleminden bağımsızdır. Koleksiyonunuzun mevcut durumu hakkında ön bilgi sağlarlar.</p>
            <div className="space-y-4">
                {preAnalysisReports.map(report => (
                    <ReportCard key={report.id} report={report} isXlsxReady={isXlsxReady} />
                ))}
            </div>
        </div>
    </div>
);

const ScanScreen = ({ isCameraOpen, isQrCodeReady, isCameraAllowed, setIsCameraOpen, handleCameraScan, warningModal, currentSessionName, combinedLibraries, selectedLibrary, combinedLocations, selectedLocation, barcodeInput, handleBarcodeInput, handleManualEntry, lastScanned, handleBulkUpload, isBulkLoading, setPage, scannedItems, filteredScannedItems, searchTerm, setSearchTerm, warningFilter, setWarningFilter, handleDeleteItem, handleClearAllScans }) => {
    const bulkUploadTitle = "Toplu barkod(12 veya 13 haneli) içeren not defteri(.txt) veya Excel(.xlsx) dosyası yüklemek için tıklayın";
    const bulkUploadAccept = {
        'text/plain': ['.txt'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-excel': ['.xls']
    };

    return (
        <>
            {isCameraOpen && isQrCodeReady && isCameraAllowed && <RobustBarcodeScanner onClose={() => setIsCameraOpen(false)} onScan={handleCameraScan} isPaused={warningModal.isOpen} />}
            <div className="flex flex-col md:flex-row h-full bg-slate-50">
                <div className="w-full md:w-1/3 lg:w-1/4 p-4 bg-white border-r flex flex-col">
                    <div className="flex-grow space-y-4">
                        <h2 className="text-xl font-bold text-slate-800">Sayım: {currentSessionName}</h2>
                        <div className="text-sm text-slate-600">
                            <p><span className="font-semibold">Kütüphane:</span> {combinedLibraries.get(selectedLibrary)}</p>
                            <p><span className="font-semibold">Lokasyon:</span> {selectedLocation ? combinedLocations.get(selectedLocation) : 'Tümü'}</p>
                        </div>
                        <button onClick={() => setIsCameraOpen(true)} disabled={!isQrCodeReady || !isCameraAllowed} className="w-full flex items-center justify-center gap-2 p-2 bg-slate-700 text-white rounded-md hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Kamera İle Barkod Okutma
                        </button>
                        {!isCameraAllowed && (
                            <div className="mt-2 text-xs text-center text-red-800 bg-red-100 p-2 rounded-lg border border-red-200">
                                <p className="font-semibold">
                                    <a href="#" onClick={(e) => { e.preventDefault(); localStorage.removeItem('cameraPermissionChoiceMade'); localStorage.removeItem('cameraPermissionStatus'); window.location.reload(); }} className="underline hover:text-red-900">
                                       Kamera İzni Vermek İçin Tıklayın.
                                    </a>
                                </p>
                                <p className="font-bold mt-1">Not: Tüm işlemler sıfırlanacaktır.</p>
                            </div>
                        )}
                        <form onSubmit={handleManualEntry} className="space-y-2">
                            <label htmlFor="barcode-input" className="font-semibold text-slate-700">Barkod Okut/Gir:</label>
                            <input id="barcode-input" type="tel" value={barcodeInput} onChange={handleBarcodeInput} placeholder="Barkodu okutun veya elle girin" className="w-full p-2 border border-slate-300 rounded-md" autoFocus />
                            <button type="submit" className="w-full bg-slate-600 text-white p-2 rounded-md hover:bg-slate-700">Ekle</button>
                        </form>
                        {lastScanned && <div className={`p-3 rounded-md border-l-4 ${lastScanned.isValid ? 'bg-green-100 border-green-500' : 'bg-yellow-100 border-yellow-500'}`}><p className="font-bold text-slate-800">{lastScanned.barcode}</p><p className="text-sm text-slate-600">{lastScanned.data?.['ESER ADI'] || 'Eser bilgisi bulunamadı'}</p>{lastScanned.warnings.map(w => <p key={w.id} style={{color: w.color}} className="text-sm font-semibold">{w.message || w.text}</p>)}</div>}
                        <div className="mt-4">
                            <button onClick={() => setPage('update-on-loan')} disabled={scannedItems.length === 0 || isBulkLoading} className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed">Sayımı Bitir</button>
                            <p className="text-xs text-slate-500 text-center mt-2">"Sayımı Bitir"e tıkladığınızda; özet grafikler ve raporlar görüntülenir. Daha sonra menüden "Sayım" ekranına tekrar dönüş yapabilirsiniz.</p>
                        </div>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div>
                            <label className="font-semibold text-slate-700">Toplu Yükleme (.txt/.xlsx):</label>
                            <FileUploader onFileAccepted={handleBulkUpload} title={bulkUploadTitle} accept={bulkUploadAccept} disabled={isBulkLoading} />
                        </div>
                    </div>
                </div>
                <div className="w-full md:w-2/3 lg:w-3/4 p-4 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold text-slate-800">Okutulan Materyaller ({filteredScannedItems.length} / {scannedItems.length})</h3>
                        <button onClick={handleClearAllScans} className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400" disabled={scannedItems.length === 0}>
                            Tümünü Sil
                        </button>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 mb-2">
                        <input type="text" placeholder="Barkod veya eserde ara..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-grow p-2 border border-slate-300 rounded-md" />
                        <select value={warningFilter} onChange={e => setWarningFilter(e.target.value)} className="p-2 border border-slate-300 rounded-md">
                            <option value="all">Tümünü Göster</option>
                            {Object.values(WARNING_DEFINITIONS).map(w => <option key={w.id} value={w.id}>{w.text}</option>)}
                        </select>
                    </div>
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                        {filteredScannedItems.map((item) => (
                            <div key={item.timestamp} className={`p-2 rounded-md border flex items-center justify-between gap-2 ${item.isValid ? 'bg-white' : 'bg-yellow-50'}`}>
                                <div className="flex-grow">
                                    <p className="font-mono text-slate-800">{item.barcode}</p>
                                    <p className="text-xs text-slate-600">{item.data?.['ESER ADI'] || 'Bilinmeyen Eser'}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="flex flex-wrap justify-end gap-1">
                                        {item.warnings.map(w => <span key={w.id + item.timestamp} style={{backgroundColor: w.color, color: '#fff'}} className="px-2 py-1 text-xs font-semibold rounded-full">{w.message || w.text}</span>)}
                                        {item.isValid && <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Temiz</span>}
                                    </div>
                                    <button onClick={() => handleDeleteItem(item.timestamp)} className="p-1 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600" title="Bu kaydı sil">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

const UpdateOnLoanScreen = ({ handleOnLoanUpload, setPage, isXlsxReady, isLoading }) => (
    <div className="max-w-3xl mx-auto w-full p-8 bg-white rounded-lg shadow-sm space-y-6 border">
        <h1 className="text-3xl font-bold text-slate-800">Güncel Ödünç Verilmiş Materyalleri Yükle</h1>
        <p className="text-slate-600 mb-4">
            Eğer sayım sırasında ödünç verme işlemi yapıldıysa, Koha'dan alacağınız güncel ödünç verilmiş materyallerin listesini (sadece barkodları içeren .txt veya .xlsx) buraya yükleyerek eksik listesinin daha doğru oluşturulmasını sağlayabilirsiniz.
        </p>
        <a href="https://www.ismailkaraca.com.tr/gulcelodunc.html" target="_blank" rel="noopener noreferrer" className="w-full mb-2 inline-block text-center px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">Güncel Ödünç Listesi indirmek için tıklayınız</a>
        <FileUploader 
            onFileAccepted={handleOnLoanUpload} 
            title="Güncel ödünç listesini buraya sürükleyin veya seçmek için tıklayın" 
            disabled={!isXlsxReady || isLoading} 
            accept={{'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'], 'text/plain': ['.txt']}}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h10a4 4 0 014 4v5m-4 4h-5m5-4l-5 4m0 0l-5-4m5 4v-7" /></svg>
        </FileUploader>
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
             <button 
                onClick={() => setPage('summary')}
                className="w-full font-bold py-3 px-4 rounded-md transition-colors bg-slate-600 text-white hover:bg-slate-700"
            >
                Bu Adımı Atla ve Raporları Gör
            </button>
        </div>
    </div>
);


const SummaryScreen = ({ currentSessionName, summaryData, preAnalysisReports, postScanReports, isXlsxReady, isHtmlToImageReady }) => {
    const generalStatusRef = useRef(null);
    const materialTypeRef = useRef(null);
    const materialStatusRef = useRef(null);
    const warningBarRef = useRef(null);
    const scanProgressRef = useRef(null);
    const topErrorRef = useRef(null);
    const locationStatusRef = useRef(null);

    const downloadChart = useCallback((ref, fileName) => {
        if (ref.current === null || !isHtmlToImageReady || !window.htmlToImage) {
            console.error("Grafik referansı veya kütüphane hazır değil.");
            alert("Grafik indirme özelliği şu anda hazır değil, lütfen birkaç saniye bekleyip tekrar deneyin.");
            return;
        }
        window.htmlToImage.toPng(ref.current, { backgroundColor: '#ffffff', pixelRatio: 2 })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = fileName;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error('Grafik indirilemedi!', err);
            });
    }, [isHtmlToImageReady]);

    const downloadAllCharts = async () => {
        const charts = [
            { ref: generalStatusRef, name: `genel_durum_${currentSessionName}.png` },
            { ref: materialTypeRef, name: `materyal_turu_${currentSessionName}.png` },
            { ref: materialStatusRef, name: `materyal_statusu_${currentSessionName}.png` },
            { ref: warningBarRef, name: `uyari_turleri_${currentSessionName}.png` },
            { ref: scanProgressRef, name: `sayim_ilerlemesi_${currentSessionName}.png` },
            { ref: topErrorRef, name: `hata_veren_lokasyonlar_${currentSessionName}.png` },
            { ref: locationStatusRef, name: `lokasyon_durumu_${currentSessionName}.png` },
        ];

        for (const chart of charts) {
            await new Promise(resolve => {
                downloadChart(chart.ref, chart.name);
                setTimeout(resolve, 500); // download prompt'ları arasında kısa bir bekleme
            });
        }
    };

    const renderLegendWithCount = (value, entry) => {
        const { color } = entry;
        return <span style={{ color }}>{value} ({entry.payload.value})</span>;
    };

    const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);
        return (
            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontWeight="bold">
                {value > 0 ? value : ''}
            </text>
        );
    };

    if (!summaryData) {
        return <div className="text-center p-10">Raporları görmek için lütfen sayıma başlayın.</div>;
    }

    const ChartContainer = ({ chartRef, title, children, fileName }) => (
        <div ref={chartRef} className="bg-white p-6 rounded-lg shadow-sm border h-96 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-center text-slate-700 flex-1">{title}</h3>
                <button onClick={() => downloadChart(chartRef, fileName)} disabled={!isHtmlToImageReady} title="Grafiği İndir" className="p-1 text-slate-500 hover:bg-slate-200 rounded-full disabled:opacity-50">
                    {ICONS.download}
                </button>
            </div>
            <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
    );

    return (
        <div className="w-full">
            <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Sayım Özeti: {currentSessionName}</h1>
                <button onClick={downloadAllCharts} disabled={!isHtmlToImageReady} className="flex items-center gap-2 bg-green-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50">
                    {ICONS.download} Tüm Grafikleri İndir
                </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                    <div className="bg-blue-100 p-4 rounded-lg"><p className="text-2xl font-bold text-blue-800">{summaryData.totalScanned}</p><p>Toplam Okutulan</p></div>
                    <div className="bg-green-100 p-4 rounded-lg"><p className="text-2xl font-bold text-green-800">{summaryData.valid}</p><p>Geçerli (Temiz)</p></div>
                    <div className="bg-yellow-100 p-4 rounded-lg"><p className="text-2xl font-bold text-yellow-800">{summaryData.invalid}</p><p>Hatalı/Uyarılı</p></div>
                    <div className="bg-slate-200 p-4 rounded-lg"><p className="text-2xl font-bold text-slate-800">{summaryData.notScannedCount}</p><p>Eksik</p></div>
                    <div className="bg-indigo-100 p-4 rounded-lg"><p className="text-2xl font-bold text-indigo-800">{summaryData.scanSpeed}</p><p>Materyal / dk</p></div>
                </div>
                 <p className="text-xs text-center mt-4 text-slate-500">Not: "Geçerli", "Hatalı/Uyarılı" ve "Eksik" sayıları, sadece materyal statüsü "Eser Koleksiyonda" olanlar üzerinden hesaplanmıştır.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-8">
                <ChartContainer chartRef={generalStatusRef} title="Genel Durum (Aktif Koleksiyon)" fileName={`genel_durum_${currentSessionName}.png`}>
                    <PieChart><Pie data={summaryData.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={renderPieLabel}>{summaryData.pieData.map((entry, i) => <Cell key={`cell-${i}`} fill={PIE_CHART_COLORS[entry.name === 'Geçerli' ? 'valid' : entry.name === 'Uyarılı' ? 'invalid' : 'missing']} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend formatter={renderLegendWithCount} /></PieChart>
                </ChartContainer>
                <ChartContainer chartRef={materialTypeRef} title="Materyal Türü (Aktif Koleksiyon)" fileName={`materyal_turu_${currentSessionName}.png`}>
                     <PieChart><Pie data={summaryData.materialTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>{summaryData.materialTypeData.map((e, i) => <Cell key={`cell-${i}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'][i % 5]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend formatter={renderLegendWithCount} /></PieChart>
                </ChartContainer>
                <ChartContainer chartRef={materialStatusRef} title="Materyal Statüsü (Tüm Liste)" fileName={`materyal_statusu_${currentSessionName}.png`}>
                    <PieChart><Pie data={summaryData.materialStatusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>{summaryData.materialStatusPieData.map((e, i) => <Cell key={`cell-${i}`} fill={['#3498DB', '#E74C3C', '#9B59B6', '#F1C40F'][i % 4]} />)}</Pie><Tooltip content={<CustomTooltip />} /><Legend formatter={renderLegendWithCount} /></PieChart>
                </ChartContainer>
                <ChartContainer chartRef={warningBarRef} title="Uyarı Türleri (Tüm Okutulanlar)" fileName={`uyari_turleri_${currentSessionName}.png`}>
                    <BarChart data={summaryData.warningBarData} layout="vertical" margin={{left: 100}}><CartesianGrid strokeDasharray="3 3" stroke={'#ccc'} /><XAxis type="number" stroke={'#666'} /><YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fill: '#333' }} stroke={'#666'} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="Sayı">{summaryData.warningBarData.map((e, i) => <Cell key={`cell-${i}`} fill={WARNING_DEFINITIONS[Object.keys(WARNING_DEFINITIONS).find(k => WARNING_DEFINITIONS[k].text === e.name)]?.color || '#8884d8'} />)}<LabelList dataKey="Sayı" position="right" style={{ fill: '#333' }} /></Bar></BarChart>
                </ChartContainer>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                 <ChartContainer chartRef={scanProgressRef} title="Sayım İlerleme Grafiği" fileName={`sayim_ilerlemesi_${currentSessionName}.png`}>
                    <LineChart data={summaryData.scanProgressData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="time" /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="Okutulan Sayısı" stroke="#8884d8" activeDot={{ r: 8 }} /></LineChart>
                 </ChartContainer>
                 <ChartContainer chartRef={topErrorRef} title="En Çok Hata Veren Raf/Lokasyon" fileName={`hata_veren_lokasyonlar_${currentSessionName}.png`}>
                    <BarChart layout="vertical" data={summaryData.topErrorLocationsData} margin={{ top: 20, right: 30, left: 100, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" /><YAxis type="category" dataKey="name" /><Tooltip /><Legend /><Bar dataKey="Hata Sayısı" fill="#E74C3C"><LabelList dataKey="Hata Sayısı" position="right" style={{ fill: '#333' }} /></Bar></BarChart>
                 </ChartContainer>
            </div>
             <div ref={locationStatusRef} className="bg-white p-6 rounded-lg shadow-sm border h-[500px] mb-8 flex flex-col">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-semibold text-center text-slate-700 flex-1">Lokasyon Bazında Sayım Durumu (Aktif Koleksiyon)</h3>
                    <button onClick={() => downloadChart(locationStatusRef, `lokasyon_durumu_${currentSessionName}.png`)} disabled={!isHtmlToImageReady} title="Grafiği İndir" className="p-1 text-slate-500 hover:bg-slate-200 rounded-full disabled:opacity-50">
                        {ICONS.download}
                    </button>
                </div>
                <ResponsiveContainer>
                    <BarChart data={summaryData.locationStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} />
                        <YAxis />
                        <Tooltip />
                        <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: 10 }}/>
                        <Bar dataKey="Geçerli" stackId="a" fill="#2ECC71" />
                        <Bar dataKey="Uyarılı" stackId="a" fill="#FAD7A0" />
                        <Bar dataKey="Eksik" stackId="a" fill="#95A5A6" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-10">
                <div className="mb-12">
                    <h2 className="text-3xl font-bold mb-2 text-slate-800">Sayım Sonucu Raporları</h2>
                    <p className="text-slate-600 mb-6">Bu raporlar, sayım işlemi sırasında okutulan barkodlara göre oluşturulmuştur.</p>
                    <div className="space-y-4">
                        {postScanReports.map(report => (
                            <ReportCard key={report.id} report={report} isXlsxReady={isXlsxReady} />
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-3xl font-bold mb-2 text-slate-800">Dosya Ön Analiz Raporları</h2>
                    <p className="text-slate-600 mb-6">Bu raporlar, sayım işleminden bağımsız olarak, yalnızca başlangıçta yüklediğiniz Koha dosyasına göre oluşturulmuştur.</p>
                    <div className="space-y-4">
                        {preAnalysisReports.map(report => (
                            <ReportCard key={report.id} report={report} isXlsxReady={isXlsxReady} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function App() {
    const isXlsxReady = useScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js', 'XLSX');
    const isQrCodeReady = useScript('https://unpkg.com/html5-qrcode', 'Html5Qrcode');
    const isHtmlToImageReady = useScript('https://cdnjs.cloudflare.com/ajax/libs/html-to-image/1.11.11/html-to-image.min.js', 'htmlToImage');
    
    const [page, setPage] = useState('permission'); // 'permission', 'start', 'pre-reports', 'scan', 'summary'
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isCameraAllowed, setIsCameraAllowed] = useState(false);
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
    const [isBulkLoading, setIsBulkLoading] = useState(false);
    const [error, setError] = useState('');
    const [warningModal, setWarningModal] = useState({ isOpen: false, title: '', warnings: [], barcode: null });
    const [confirmationModal, setConfirmationModal] = useState({ isOpen: false, message: '', onConfirm: () => {} });
    const [addDataModal, setAddDataModal] = useState({ isOpen: false, type: ''});
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [customLibraries, setCustomLibraries] = useState({});
    const [customLocations, setCustomLocations] = useState({});
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isProcessingScan, setIsProcessingScan] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [warningFilter, setWarningFilter] = useState('all');
    const [isMuted, setIsMuted] = useState(false);
    const [installPrompt, setInstallPrompt] = useState(null);
    const [isNavigatingToSummary, setIsNavigatingToSummary] = useState(false);
    const [bulkProgress, setBulkProgress] = useState(null);
    
    const processedBarcodesRef = useRef(new Set());
    const manualInputDebounceRef = useRef(null);

    useEffect(() => {
        // Tarayıcının sayfayı otomatik olarak çevirmeye çalışmasını önlemek için dil etiketini 'tr' olarak ayarla
        document.documentElement.lang = 'tr';
        
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('Kullanıcı uygulamayı yükledi');
            } else {
                console.log('Kullanıcı yükleme istemini reddetti');
            }
            setInstallPrompt(null);
        });
    };

    // Load settings from localStorage on initial mount
    useEffect(() => {
        const savedMute = localStorage.getItem('isMuted') === 'true';
        setIsMuted(savedMute);
    }, []);

    // Save mute setting to localStorage
    useEffect(() => {
        localStorage.setItem('isMuted', isMuted);
    }, [isMuted]);

    const playSound = useCallback((note) => {
        if (isMuted) return;
        try {
            if (Tone.context.state !== 'running') {
                Tone.context.resume();
            }
            synth.triggerAttackRelease(note, "8n");
        } catch (e) {
            console.error("Ses çalınamadı:", e);
        }
    }, [isMuted]);

    const playMultipleWarningSound = useCallback(() => {
        if (isMuted) return;
        try {
            if (Tone.context.state !== 'running') {
                Tone.context.resume();
            }
            const now = Tone.now();
            synth.triggerAttackRelease("C5", "16n", now);
            synth.triggerAttackRelease("G4", "16n", now + 0.1);
            synth.triggerAttackRelease("C5", "16n", now + 0.2);
            synth.triggerAttackRelease("G4", "16n", now + 0.3);
            synth.triggerAttackRelease("E5", "8n", now + 0.4);
        } catch (e) {
            console.error("Ses çalınamadı:", e);
        }
    }, [isMuted]);

    useEffect(() => {
        try {
            const choiceMade = localStorage.getItem('cameraPermissionChoiceMade');
            if (choiceMade) {
                const permissionStatus = localStorage.getItem('cameraPermissionStatus');
                setIsCameraAllowed(permissionStatus === 'granted');
                setPage('start');
            } else {
                setPage('permission');
            }

            const savedSessions = localStorage.getItem('kohaInventorySessions');
            if (savedSessions) setSessions(JSON.parse(savedSessions));
            const savedLibs = localStorage.getItem('customLibraries');
            if (savedLibs) setCustomLibraries(JSON.parse(savedLibs));
            const savedLocs = localStorage.getItem('customLocations');
            if (savedLocs) setCustomLocations(JSON.parse(savedLocs));
        } catch (e) {
            console.error("Veriler yüklenemedi:", e);
            setPage('start'); // Hata durumunda ana sayfaya yönlendir
        }
    }, []);
    
    useEffect(() => {
        if (currentSessionName) {
            const sessionToSave = {
                name: currentSessionName,
                library: selectedLibrary,
                location: selectedLocation,
                items: scannedItems,
                lastUpdated: new Date().toISOString()
            };

            try {
                // Don't stringify kohaData if it's large, handle re-upload on load
                sessionToSave.kohaData = JSON.stringify(kohaData);
                localStorage.setItem(`koha_session_${currentSessionName}`, JSON.stringify(sessionToSave));
            } catch (e) {
                console.error("Oturum kaydedilemedi (veri büyük olabilir):", e);
                setError("Oturum verisi çok büyük olduğu için kaydedilemedi. Lütfen sayfayı yenilemeyin.");
                // Save without kohaData as a fallback
                delete sessionToSave.kohaData;
                localStorage.setItem(`koha_session_${currentSessionName}`, JSON.stringify(sessionToSave));
            }

            // Update the sessions list
            setSessions(prev => ({...prev, [currentSessionName]: {name: currentSessionName, items: scannedItems, lastUpdated: new Date().toISOString()}}));
        }
    }, [currentSessionName, selectedLibrary, selectedLocation, scannedItems, kohaData]);

    const handlePermissionDecision = (allow) => {
        setIsCameraAllowed(allow);
        setPage('start');
    };

    const startNewSession = () => {
        if (!sessionNameInput) { setError("Lütfen yeni sayım için bir isim girin."); return; }
        if (sessions[sessionNameInput]) { setError("Bu isimde bir sayım zaten mevcut. Farklı bir isim seçin."); return; }
        
        setCurrentSessionName(sessionNameInput);
        setScannedItems([]);
        setLastScanned(null);
        processedBarcodesRef.current.clear();
        setError('');
        setPage('pre-reports');
    };
    
    const loadSession = (sessionName) => {
        const sessionString = localStorage.getItem(`koha_session_${sessionName}`);
        if (sessionString) {
            const session = JSON.parse(sessionString);
            setCurrentSessionName(session.name);
            setSelectedLibrary(session.library);
            setSelectedLocation(session.location);
            setScannedItems(session.items || []);
            processedBarcodesRef.current = new Set((session.items || []).map(i => i.barcode));
            setLastScanned((session.items || []).length > 0 ? session.items[0] : null);
            setError('');

            if (session.kohaData) {
                 try {
                    const parsedData = JSON.parse(session.kohaData);
                    setKohaData(parsedData);
                    setKohaDataMap(new Map(parsedData.map(item => [String(item.BARKOD), item])));
                    setPage('pre-reports');
                } catch (e) {
                    setError("Kayıtlı oturum verisi bozuk. Lütfen Excel dosyasını tekrar yükleyin.");
                    setKohaData([]);
                    setKohaDataMap(new Map());
                    setPage('start'); // Go back to start to re-upload
                }
            } else {
                setError("Bu oturum için kayıtlı veri bulunamadı. Lütfen devam etmek için ilgili Koha Excel dosyasını yükleyin.");
                setKohaData([]);
                setKohaDataMap(new Map());
                setPage('start'); // Go back to start to re-upload
            }
        }
    };

    const deleteSession = (sessionName) => { setConfirmationModal({ isOpen: true, message: `"${sessionName}" isimli sayımı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`, onConfirm: () => { const newSessions = { ...sessions }; delete newSessions[sessionName]; setSessions(newSessions); localStorage.removeItem(`koha_session_${sessionName}`); } }); };
    
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
    
    const libraryOptions = useMemo(() => {
        const optionsMap = new Map(INITIAL_LIBRARIES);
        Object.entries(customLibraries).forEach(([code, name]) => optionsMap.set(code, name));
        return Array.from(optionsMap.entries());
    }, [customLibraries]);

    const locationOptions = useMemo(() => {
        const optionsMap = new Map(INITIAL_LOCATIONS);
        Object.entries(customLocations).forEach(([code, name]) => optionsMap.set(code, name));
        return Array.from(optionsMap.entries());
    }, [customLocations]);

    const combinedLibraries = useMemo(() => new Map(libraryOptions), [libraryOptions]);
    const combinedLocations = useMemo(() => new Map(locationOptions), [locationOptions]);

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
    
    const processBarcode = useCallback((barcode, isBulk = false) => {
        const rawBarcode = String(barcode).trim();
        if (!rawBarcode || !selectedLibrary) return false;
        
        let originalBarcode = rawBarcode.replace(/[^0-9]/g, '');
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
        
        if (processedBarcodesRef.current.has(normalizedBarcode)) {
            const warning = WARNING_DEFINITIONS.duplicate;
            const existingItemData = scannedItems.find(item => item.barcode === normalizedBarcode)?.data || kohaDataMap.get(normalizedBarcode);
            const scanResult = { barcode: normalizedBarcode, isValid: false, warnings: [warning], data: existingItemData, timestamp: new Date().toISOString() };
            setScannedItems(prev => [scanResult, ...prev]);
            setLastScanned(scanResult);
            if (!isBulk) {
                playSound(warning.sound);
                setWarningModal({ isOpen: true, title: 'Tekrarlı Barkod Uyarısı', warnings: [warning], barcode: normalizedBarcode });
            }
            return true;
        }
        
        processedBarcodesRef.current.add(normalizedBarcode);
        
        if (normalizedBarcode.length === 12 && !normalizedBarcode.startsWith(expectedPrefix)) {
            let finalWarning = null;
            let found = false;
            for (const [code, name] of combinedLibraries.entries()) {
                const prefix = String(parseInt(code, 10) + 1000);
                if (normalizedBarcode.startsWith(prefix)) {
                    finalWarning = { ...WARNING_DEFINITIONS.wrongLibrary, message: `Farklı Kütüphane (${name})`, libraryName: name };
                    found = true;
                    break;
                }
            }
            if (!found) {
                finalWarning = WARNING_DEFINITIONS.invalidStructure;
            }
            const scanResult = { barcode: originalBarcode, isValid: false, warnings: [finalWarning], data: kohaDataMap.get(normalizedBarcode) || null, timestamp: new Date().toISOString() };
            setLastScanned(scanResult);
            setScannedItems(prev => [scanResult, ...prev]);
            if (!isBulk) {
                playSound(finalWarning.sound);
                setWarningModal({ isOpen: true, title: 'Hatalı Barkod', warnings: [finalWarning], barcode: originalBarcode });
            }
            return true;
        }

        const itemData = kohaDataMap.get(normalizedBarcode);
        const warnings = [];
        if (itemData) {
            if (String(itemData['KÜTÜPHANE KODU'] || '') !== selectedLibrary) {
                const wrongLibCode = itemData['KÜTÜPHANE KODU'];
                const wrongLibName = combinedLibraries.get(wrongLibCode) || `Bilinmeyen Kod: ${wrongLibCode}`;
                warnings.push({ ...WARNING_DEFINITIONS.wrongLibrary, message: `Farklı Kütüphane (${wrongLibName})`, libraryName: wrongLibName });
            }
            if (selectedLocation && String(itemData['MATERYALİN YERİ KODU'] || '') !== selectedLocation) warnings.push(WARNING_DEFINITIONS.locationMismatch);
            const loanEligibilityCode = String(itemData['ÖDÜNÇ VERİLEBİLİRLİK KODU']);
            if (!['0', '2'].includes(loanEligibilityCode)) {
                 const loanStatusText = itemData['ÖDÜNÇ VERİLEBİLİRLİK DURUMU'] || 'Bilinmiyor';
                 warnings.push({ ...WARNING_DEFINITIONS.notLoanable, message: `Ödünç Verilemez (${loanStatusText})` });
            }
            if (String(itemData['MATERYAL STATÜSÜ']) !== '0') warnings.push(WARNING_DEFINITIONS.notInCollection);
            if (itemData['İADE EDİLMESİ GEREKEN TARİH']) warnings.push(WARNING_DEFINITIONS.onLoan);
        } else {
             warnings.push(wasAutoCompleted ? WARNING_DEFINITIONS.autoCompletedNotFound : WARNING_DEFINITIONS.deleted);
        }
        
        const scanResult = { barcode: normalizedBarcode, isValid: warnings.length === 0, hasWarnings: warnings.length > 0, warnings, data: itemData, timestamp: new Date().toISOString() };
        setLastScanned(scanResult);
        setScannedItems(prev => [scanResult, ...prev]);
        
        if (warnings.length > 0) {
            if (!isBulk) {
                if (warnings.length > 1) playMultipleWarningSound();
                else playSound(warnings[0].sound);
                setWarningModal({ isOpen: true, title: 'Uyarılar', warnings, barcode: normalizedBarcode });
            }
            return true;
        }
        
        if (!isBulk) playSound('C5');
        return false;
    }, [selectedLibrary, selectedLocation, kohaDataMap, combinedLibraries, playSound, playMultipleWarningSound, scannedItems]);

    const handleCameraScan = useCallback((decodedText) => {
        setIsProcessingScan(true);
        const hasWarning = processBarcode(decodedText);
        if (hasWarning) {
            setIsCameraOpen(false);
        }
        setTimeout(() => setIsProcessingScan(false), 500);
    }, [processBarcode]);
    
    const handleBarcodeInput = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setBarcodeInput(value);

        if (manualInputDebounceRef.current) {
            clearTimeout(manualInputDebounceRef.current);
        }
        
        if (value.length >= 12) {
            manualInputDebounceRef.current = setTimeout(() => {
                processBarcode(value);
                setBarcodeInput('');
            }, 100);
        }
    };
    
    const handleDeleteItem = (timestampToDelete) => { 
        setConfirmationModal({ 
            isOpen: true, 
            message: "Bu kaydı silmek istediğinizden emin misiniz?", 
            onConfirm: () => { 
                let barcodeToDelete;
                let isLastInstanceOfBarcode = false;

                setScannedItems(currentItems => {
                    const itemToDelete = currentItems.find(item => item.timestamp === timestampToDelete);
                    if (!itemToDelete) return currentItems;
                    
                    barcodeToDelete = itemToDelete.barcode;
                    const count = currentItems.filter(item => item.barcode === barcodeToDelete).length;
                    isLastInstanceOfBarcode = count === 1;

                    const newItems = currentItems.filter(item => item.timestamp !== timestampToDelete);

                    if (lastScanned && lastScanned.timestamp === timestampToDelete) {
                        setLastScanned(newItems.length > 0 ? newItems[0] : null);
                    }
                    
                    if (isLastInstanceOfBarcode) {
                        processedBarcodesRef.current.delete(barcodeToDelete);
                    }
                    return newItems;
                });
            } 
        }); 
    };
    
    const handleClearAllScans = () => {
        setConfirmationModal({
            isOpen: true,
            message: "Okutulan tüm barkodları silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
            onConfirm: () => {
                setScannedItems([]);
                processedBarcodesRef.current.clear();
                setLastScanned(null);
            }
        });
    };

    const handleManualEntry = (e) => { e.preventDefault(); if (barcodeInput) { if (manualInputDebounceRef.current) clearTimeout(manualInputDebounceRef.current); processBarcode(barcodeInput); setBarcodeInput(''); } };

    const processBarcodesInBatches = (barcodes, onLoan = false) => {
        setIsBulkLoading(true);
        setBulkProgress({ current: 0, total: barcodes.length });
        
        let currentIndex = 0;
        const batchSize = 500;
        let allNewScans = [];

        const processNextBatch = () => {
            const batch = barcodes.slice(currentIndex, currentIndex + batchSize);
            if (batch.length === 0) {
                setScannedItems(prev => [...allNewScans, ...prev]);
                setIsBulkLoading(false);
                setBulkProgress(null);
                 if (onLoan) {
                    setIsNavigatingToSummary(true);
                    setTimeout(() => {
                        setPage('summary');
                        setIsNavigatingToSummary(false);
                    }, 1500);
                }
                return;
            }

            const batchScans = [];
            for (const barcode of batch) {
                const rawBarcode = String(barcode).trim();
                if (!rawBarcode || !selectedLibrary) continue;

                let originalBarcode = rawBarcode.replace(/[^0-9]/g, '');
                let normalizedBarcode = originalBarcode;
                let wasAutoCompleted = false;
                const expectedPrefix = String(parseInt(selectedLibrary, 10) + 1000);

                if (normalizedBarcode.length >= 13) { normalizedBarcode = normalizedBarcode.slice(0, 12); }
                if(normalizedBarcode.length < 12 && normalizedBarcode.length > 0) {
                    wasAutoCompleted = true; 
                    normalizedBarcode = expectedPrefix + originalBarcode.padStart(12 - expectedPrefix.length, '0');
                }
                
                if (onLoan) {
                     const itemData = kohaDataMap.get(normalizedBarcode);
                     processedBarcodesRef.current.add(normalizedBarcode);
                     batchScans.push({
                        barcode: normalizedBarcode,
                        isValid: false,
                        warnings: [WARNING_DEFINITIONS.onLoan],
                        data: itemData,
                        timestamp: new Date().toISOString()
                    });
                    continue;
                }

                if (processedBarcodesRef.current.has(normalizedBarcode)) continue;
                
                processedBarcodesRef.current.add(normalizedBarcode);
                
                const itemData = kohaDataMap.get(normalizedBarcode);
                const warnings = [];

                if (itemData) {
                    if (String(itemData['KÜTÜPHANE KODU'] || '') !== selectedLibrary) {
                        const wrongLibCode = itemData['KÜTÜPHANE KODU'];
                        const wrongLibName = combinedLibraries.get(wrongLibCode) || `Bilinmeyen Kod: ${wrongLibCode}`;
                        warnings.push({ ...WARNING_DEFINITIONS.wrongLibrary, message: `Farklı Kütüphane (${wrongLibName})`, libraryName: wrongLibName });
                    }
                    if (selectedLocation && String(itemData['MATERYALİN YERİ KODU'] || '') !== selectedLocation) warnings.push(WARNING_DEFINITIONS.locationMismatch);
                    const loanEligibilityCode = String(itemData['ÖDÜNÇ VERİLEBİLİRLİK KODU']);
                    if (!['0', '2'].includes(loanEligibilityCode)) {
                         const loanStatusText = itemData['ÖDÜNÇ VERİLEBİLİRLİK DURUMU'] || 'Bilinmiyor';
                         warnings.push({ ...WARNING_DEFINITIONS.notLoanable, message: `Ödünç Verilemez (${loanStatusText})` });
                    }
                    if (String(itemData['MATERYAL STATÜSÜ']) !== '0') warnings.push(WARNING_DEFINITIONS.notInCollection);
                    if (itemData['İADE EDİLMESİ GEREKEN TARİH']) warnings.push(WARNING_DEFINITIONS.onLoan);
                } else {
                     warnings.push(wasAutoCompleted ? WARNING_DEFINITIONS.autoCompletedNotFound : WARNING_DEFINITIONS.deleted);
                }

                const scanResult = { barcode: normalizedBarcode, isValid: warnings.length === 0, hasWarnings: warnings.length > 0, warnings, data: itemData, timestamp: new Date().toISOString() };
                batchScans.push(scanResult);
            }
            
            if (onLoan) {
                const uploadedBarcodes = new Set(batch.map(b => String(b).trim().replace(/[^0-9]/g, '')).filter(Boolean));
                setScannedItems(prevItems => {
                    const otherItems = prevItems.filter(item => !uploadedBarcodes.has(item.barcode));
                    return [...batchScans, ...otherItems];
                });
            } else {
                 allNewScans.push(...batchScans);
            }

            currentIndex += batch.length;
            setBulkProgress({ current: currentIndex, total: barcodes.length });
            
            setTimeout(processNextBatch, 20);
        };

        processNextBatch();
    };

    const handleBulkUpload = (file) => {
        if (!file) return;
        const reader = new FileReader();
        const fileExtension = file.name.split('.').pop().toLowerCase();

        reader.onload = (e) => {
            try {
                let barcodes = [];
                if (fileExtension === 'txt') {
                    barcodes = e.target.result.split(/\r?\n/).filter(line => line.trim() !== '');
                } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                    if (!isXlsxReady) {
                        setError("Excel kütüphanesi henüz hazır değil.");
                        return;
                    }
                    const data = new Uint8Array(e.target.result);
                    const workbook = window.XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    barcodes = json.map(row => row[0]).filter(barcode => barcode !== null && barcode !== undefined && String(barcode).trim() !== '');
                }
                processBarcodesInBatches(barcodes, false);
            } catch (err) {
                setError(`Toplu yükleme sırasında hata: ${err.message}`);
                setIsBulkLoading(false);
            }
        };
        reader.onerror = () => {
            setError("Dosya okuma başarısız oldu.");
            setIsBulkLoading(false);
        };

        if (fileExtension === 'txt') reader.readAsText(file);
        else if (fileExtension === 'xlsx' || fileExtension === 'xls') reader.readAsArrayBuffer(file);
        else setError("Lütfen geçerli bir .txt veya .xlsx dosyası yükleyin.");
    };

    const handleOnLoanUpload = (file) => {
        if (!file) return;
        const reader = new FileReader();
        const fileExtension = file.name.split('.').pop().toLowerCase();
        reader.onload = (e) => {
            try {
                let barcodes = [];
                if (fileExtension === 'txt') {
                    barcodes = e.target.result.split(/\r?\n/).filter(line => line.trim() !== '');
                } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                     if (!isXlsxReady) {
                        setError("Excel kütüphanesi henüz hazır değil.");
                        return;
                    }
                    const data = new Uint8Array(e.target.result);
                    const workbook = window.XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    barcodes = json.map(row => row[0]).filter(barcode => barcode !== null && barcode !== undefined && String(barcode).trim() !== '');
                }
                processBarcodesInBatches(barcodes, true);
            } catch (err) {
                 setError(`Güncel ödünç listesi işlenirken hata: ${err.message}`);
                 setIsBulkLoading(false);
            }
        };
         reader.onerror = () => {
            setError("Dosya okuma başarısız oldu.");
            setIsBulkLoading(false);
        };

        if (fileExtension === 'txt') reader.readAsText(file);
        else if (fileExtension === 'xlsx' || fileExtension === 'xls') reader.readAsArrayBuffer(file);
        else setError("Lütfen geçerli bir .txt veya .xlsx dosyası yükleyin.");
    };


    const filteredScannedItems = useMemo(() => scannedItems.filter(item => (searchTerm ? (item.barcode.includes(searchTerm) || String(item.data?.['ESER ADI'] || '').toLowerCase().includes(searchTerm.toLowerCase())) : true) && (warningFilter === 'all' ? true : item.warnings.some(w => w.id === warningFilter))), [scannedItems, searchTerm, warningFilter]);

    // --- Report Generation ---
    const downloadTxt = (data, filename) => { const blob = new Blob([data], { type: 'text/plain;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); };
    const downloadXlsx = (data, filename) => { if (!isXlsxReady) { alert("Excel kütüphanesi hazır değil."); return; } const ws = window.XLSX.utils.json_to_sheet(data); const wb = window.XLSX.utils.book_new(); window.XLSX.utils.book_append_sheet(wb, ws, "Rapor"); window.XLSX.writeFile(wb, filename); };
    
    const PRE_ANALYSIS_REPORTS_CONFIG = useMemo(() => [
        { 
            id: 'preOnLoan', 
            title: 'Ödünçteki Materyaller', 
            format: '.xlsx', 
            icon: ICONS.onLoan, 
            description: 'Koha verisine göre halihazırda bir okuyucunun üzerinde ödünçte görünen materyaller.', 
            generator: () => { 
                const data = kohaData.filter(i => String(i['ÖDÜNÇTE Mİ']) === '1').map(i => ({ 'İade Tarihi': i['ÖDÜNÇTEKİ MATERYALİN İADE EDİLMESİ GEREKEN TARİH'], ...i })); 
                downloadXlsx(data, `on_analiz_oduncteki_materyaller_${currentSessionName}.xlsx`); 
            } 
        },
        { 
            id: 'preStatusIssues', 
            title: 'Düşüm / Devir Statüsündeki Materyaller', 
            format: '.xlsx', 
            icon: ICONS.status, 
            description: 'Koha verisine göre materyal statüsü "düşüm" veya "devir" gibi koleksiyon dışı bir durumu gösteren tüm materyaller.', 
            generator: () => { 
                const data = kohaData.filter(i => String(i['MATERYAL STATÜSÜ']) !== '0'); 
                downloadXlsx(data, `on_analiz_dusum_devir_statulu_${currentSessionName}.xlsx`); 
            } 
        },
        { 
            id: 'preNotLoanable', 
            title: 'Ödünç Verilebilirlik Durumu "Ödünç Verilemez - ..." Olan Materyaller', 
            format: '.xlsx', 
            icon: ICONS.notLoanable, 
            description: 'Koha verisine göre Ödünç Verilebilirlik Durumu "Ödünç Verilebilir" Olmayan Tüm Materyaller.', 
            generator: () => { 
                const data = kohaData.filter(i => String(i['ÖDÜNÇ VERİLEBİLİRLİK KODU']) !== '0'); 
                downloadXlsx(data, `on_analiz_odunc_verilemeyenler_${currentSessionName}.xlsx`); 
            } 
        },
    ], [kohaData, currentSessionName, isXlsxReady]);


    const POST_SCAN_REPORTS_CONFIG = useMemo(() => [
        { id: 'writeOff', title: 'Düşüm İşlemi İçin Barkodlar (Eksikler)', format: '.txt', icon: ICONS.writeOff, description: "Bu dosya, Koha Materyal Düzeltme/Düşüm Modülü'ne yüklenerek materyallerin topluca düşümünü sağlar.", links: [{ text: 'Koha Düşüm Modülü', url: 'https://personel.ekutuphane.gov.tr/cgi-bin/koha/tools/batchMod.pl' }], notes: ['Sadece Müdür/Yönetici yetkisine sahip personel erişebilir.', 'Yetkisi olmayanlar koha@ktb.gov.tr adresinden talep edebilir.'], generator: () => { const scannedBarcodes = new Set(scannedItems.filter(i => !i.warnings.some(w => w.id === 'duplicate')).map(i => i.barcode)); const missingBarcodes = kohaData.filter(i => String(i['KÜTÜPHANE KODU']) === selectedLibrary && !scannedBarcodes.has(String(i.BARKOD))).map(i => String(i.BARKOD).slice(0, 12)); downloadTxt(missingBarcodes.join('\n'), `sayim_sonucu_dusum_icin_eksik_barkodlar_${currentSessionName}.txt`); } },
        { id: 'missing', title: 'Eksik Materyaller', format: '.xlsx', icon: ICONS.missing, description: 'Sayım sırasında hiç okutulmamış olan, kütüphane koleksiyonuna ait materyallerin listesi.', generator: () => { const scannedBarcodes = new Set(scannedItems.filter(i => !i.warnings.some(w => w.id === 'duplicate')).map(i => i.barcode)); const missingItems = kohaData.filter(i => String(i['KÜTÜPHANE KODU']) === selectedLibrary && !scannedBarcodes.has(String(i.BARKOD))); downloadXlsx(missingItems, `sayim_sonucu_eksik_materyaller_${currentSessionName}.xlsx`); } },
        { id: 'duplicateScans', title: 'Tekrar Okutulan Barkodlar', format: '.xlsx', icon: ICONS.all, description: 'Sayım sırasında birden fazla kez okutulan tüm barkodların listesi. Bu rapor, hem koleksiyon listesinde olan hem de olmayan tekrar okutulmuş barkodları içerir.', generator: () => { const barcodeCounts = scannedItems.reduce((acc, item) => { acc[item.barcode] = (acc[item.barcode] || 0) + 1; return acc; }, {}); const duplicates = Object.entries(barcodeCounts).filter(([, count]) => count > 1).map(([barcode, count]) => { const firstInstance = scannedItems.find(item => item.barcode === barcode); const itemData = firstInstance?.data; const wrongLibWarning = firstInstance.warnings.find(w => w.id === 'wrongLibrary'); return { 'Barkod': barcode, 'Tekrar Sayısı': count, 'Eser Adı': itemData?.['ESER ADI'] || 'Bilinmiyor', 'Farklı Kütüphane Adı': wrongLibWarning?.libraryName || '' }; }); downloadXlsx(duplicates, `sayim_sonucu_tekrar_okutulanlar_${currentSessionName}.xlsx`); } },
        { id: 'invalidStructure', title: '❗ Yapıya Uygun Olmayan Barkodlar (Okutulanlar)', format: '.xlsx', icon: ICONS.status, description: 'Sayım sırasında okutulan ve barkod yapısı bilinen hiçbir kütüphane koduna uymayan barkodlar.', generator: () => { const data = scannedItems.filter(i => i.warnings.some(w => w.id === 'invalidStructure')).map(i => ({ Hatalı_Barkod: i.barcode })); downloadXlsx(data, `sayim_sonucu_yapiya_uygun_olmayanlar_${currentSessionName}.xlsx`); } },
        { id: 'deletedScanned', title: '❗ Listede Olmayan ve Sayımı Yapılan Barkodlar', format: '.xlsx', icon: ICONS.status, description: 'Sayım sırasında okutulan ancak Koha\'dan indirilen listede bulunamayan barkodlar (muhtemelen sistemden silinmiş veya hatalı girilmiş).', generator: () => { const data = scannedItems.filter(i => i.warnings.some(w => w.id === 'deleted' || w.id === 'autoCompletedNotFound')).map(i => ({ Barkod: i.barcode, 'Not': 'Okutuldu, listede bulunamadı' })); downloadXlsx(data, `sayim_sonucu_listede_olmayan_okutulanlar_${currentSessionName}.xlsx`); } },
        { id: 'allResults', title: 'Tüm Sayım Sonuçları (Uyarılar Dahil)', format: '.xlsx', icon: ICONS.all, description: 'Sayım boyunca okutulan tüm materyallerin, aldıkları uyarılarla birlikte tam listesi.', generator: () => { const data = scannedItems.map(i => { const wrongLibWarning = i.warnings.find(w => w.id === 'wrongLibrary'); return { Barkod: i.barcode, 'Eser Adı': i.data?.['ESER ADI'] || '', Uyarılar: i.warnings.map(w => w.message || w.text).join(', ') || 'Temiz', 'Farklı Kütüphane Adı': wrongLibWarning?.libraryName || '', ...i.data }; }); downloadXlsx(data, `sayim_sonucu_tum_sonuclar_${currentSessionName}.xlsx`); } },
        { id: 'cleanList', title: 'Temiz Liste (Uyarısız Okutulanlar)', format: '.xlsx', icon: ICONS.clean, description: 'Sayım sırasında okutulan ve hiçbir uyarı almayan, durumu ve konumu doğru olan materyallerin listesi.', generator: () => { const data = scannedItems.filter(i => i.isValid).map(i => i.data); downloadXlsx(data, `sayim_sonucu_temiz_liste_${currentSessionName}.xlsx`); } },
        { id: 'wrongLibrary', title: 'Kütüphanenize Ait Olmayan ve Okutulan Barkodlar', format: '.xlsx', icon: ICONS.wrongLib, description: 'Sayım sırasında okutulan ancak sayım yapılan kütüphaneye ait olmayan (farklı şube koduna sahip) materyaller.', generator: () => { const data = scannedItems.filter(i => i.warnings.some(w => w.id === 'wrongLibrary')).map(i => { const wrongLibWarning = i.warnings.find(w => w.id === 'wrongLibrary'); return { 'Barkod': i.barcode, 'Ait Olduğu Kütüphane': wrongLibWarning?.libraryName || 'Bilinmiyor' }; }); downloadXlsx(data, `sayim_sonucu_kutuphane_disi_${currentSessionName}.xlsx`); } },
        { id: 'locationMismatch', title: 'Yer Uyumsuzları (Okutulanlar)', format: '.xlsx', icon: ICONS.location, description: 'Sayım sırasında, başlangıçta seçilen lokasyon dışında bir yerde okutulan materyaller.', generator: () => { const data = scannedItems.filter(i => i.warnings.some(w => w.id === 'locationMismatch')).map(i => i.data); downloadXlsx(data, `sayim_sonucu_yer_uyumsuz_${currentSessionName}.xlsx`); } },
    ], [kohaData, scannedItems, currentSessionName, selectedLibrary, isXlsxReady, combinedLibraries]);

    const summaryData = useMemo(() => {
        if (scannedItems.length === 0 && kohaData.length === 0) return null;
        const STATUS_MAP = { '0': 'Eser Koleksiyonda', '1': 'Düşüm Yapıldı', '2': 'Devir Yapıldı' };
        const materialStatusCounts = kohaData.reduce((acc, item) => {
            const statusCode = String(item['MATERYAL STATÜSÜ']);
            const statusName = STATUS_MAP[statusCode] || `Bilinmeyen Statü (${statusCode})`;
            acc[statusName] = (acc[statusName] || 0) + 1;
            return acc;
        }, {});
        const materialStatusPieData = Object.entries(materialStatusCounts).map(([name, value]) => ({ name, value }));
        const warningCounts = scannedItems.flatMap(item => item.warnings).reduce((acc, warning) => { acc[warning.id] = (acc[warning.id] || 0) + 1; return acc; }, {}); const warningBarData = Object.entries(warningCounts).map(([id, count]) => ({ name: WARNING_DEFINITIONS[id]?.text || id, Sayı: count })); const scanProgress = scannedItems.reduce((acc, item) => { const hour = new Date(item.timestamp).getHours().toString().padStart(2, '0') + ':00'; acc[hour] = (acc[hour] || 0) + 1; return acc; }, {}); const scanProgressData = Object.entries(scanProgress).map(([time, count]) => ({ time, 'Okutulan Sayısı': count })).sort((a,b) => a.time.localeCompare(b.time)); const topErrorLocations = scannedItems.filter(i => i.warnings.length > 0).reduce((acc, item) => { const loc = item.data?.['MATERYALİN YERİ'] || 'Bilinmeyen'; acc[loc] = (acc[loc] || 0) + 1; return acc; }, {}); const topErrorLocationsData = Object.entries(topErrorLocations).map(([name, count]) => ({ name, 'Hata Sayısı': count })).sort((a, b) => b['Hata Sayısı'] - a['Hata Sayısı']).slice(0, 10); let scanSpeed = 0; if(scannedItems.length > 1){ const firstScanTime = new Date(scannedItems[scannedItems.length - 1].timestamp).getTime(); const lastScanTime = new Date(scannedItems[0].timestamp).getTime(); const durationMinutes = (lastScanTime - firstScanTime) / (1000 * 60); scanSpeed = durationMinutes > 0 ? Math.round(scannedItems.length / durationMinutes) : "∞"; } const activeKohaData = kohaData.filter(item => String(item['MATERYAL STATÜSÜ']) === '0'); const activeScannedItems = scannedItems.filter(item => item.data && String(item.data['MATERYAL STATÜSÜ']) === '0'); const uniqueActiveScannedItems = [...new Map(activeScannedItems.map(item => [item.barcode, item])).values()]; const valid = uniqueActiveScannedItems.filter(item => item.isValid).length; const invalid = uniqueActiveScannedItems.length - valid; const activeKohaBarcodes = new Set(activeKohaData.map(item => String(item.BARKOD))); const activeScannedBarcodes = new Set(uniqueActiveScannedItems.map(item => item.barcode)); const notScannedCount = [...activeKohaBarcodes].filter(b => !activeScannedBarcodes.has(b)).length; const pieData = [ { name: 'Geçerli', value: valid }, { name: 'Uyarılı', value: invalid }, { name: 'Eksik', value: notScannedCount } ]; const materialTypes = uniqueActiveScannedItems.reduce((acc, item) => { const type = item.data?.['MATERYAL TÜRÜ'] || 'Bilinmeyen'; acc[type] = (acc[type] || 0) + 1; return acc; }, {}); const materialTypeData = Object.entries(materialTypes).map(([name, value]) => ({name, value})); const locationStatus = {}; activeKohaData.forEach(item => { const loc = item['MATERYALİN YERİ'] || 'Bilinmeyen'; if(!locationStatus[loc]) locationStatus[loc] = { 'Geçerli': 0, 'Uyarılı': 0, 'Eksik': 0 }; }); uniqueActiveScannedItems.forEach(item => { const loc = item.data?.['MATERYALİN YERİ'] || 'Bilinmeyen'; if(!locationStatus[loc]) locationStatus[loc] = { 'Geçerli': 0, 'Uyarılı': 0, 'Eksik': 0 }; if(item.isValid) locationStatus[loc]['Geçerli']++; else locationStatus[loc]['Uyarılı']++; }); const scannedActiveKohaBarcodes = new Set(uniqueActiveScannedItems.map(i => i.barcode)); activeKohaData.forEach(item => { const loc = item['MATERYALİN YERİ'] || 'Bilinmeyen'; if(!scannedActiveKohaBarcodes.has(String(item.BARKOD))) { locationStatus[loc]['Eksik']++; } }); const locationStatusData = Object.entries(locationStatus).map(([name, data]) => ({ name, ...data })); return { totalScanned: scannedItems.length, valid, invalid, notScannedCount, scanSpeed, pieData, warningBarData, materialTypeData, scanProgressData, locationStatusData, topErrorLocationsData, materialStatusPieData }; }, [scannedItems, kohaData]);
    
    // --- Render Functions ---
    const pageTitles = {
        start: 'Yeni Sayım',
        'pre-reports': 'Ön Raporlar',
        scan: 'Sayım',
        'update-on-loan': 'Güncel Ödünçleri Yükle',
        summary: 'Özet & Raporlar',
        permission: 'Kamera İzni'
    };

    const MobileHeader = ({ onMenuClick, pageTitle }) => (
        <header className="md:hidden bg-white shadow-md p-4 flex items-center justify-between sticky top-0 z-20">
            <button onClick={onMenuClick} className="p-2 text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h2 className="text-lg font-bold text-slate-800">{pageTitle}</h2>
            <div className="w-8"></div> {/* Spacer to balance the title */}
        </header>
    );

    const renderPageContent = () => {
        switch (page) {
            case 'start':
                return <StartScreen sessions={sessions} sessionNameInput={sessionNameInput} setSessionNameInput={setSessionNameInput} startNewSession={startNewSession} error={error} setError={setError} loadSession={loadSession} deleteSession={deleteSession} selectedLibrary={selectedLibrary} setSelectedLibrary={setSelectedLibrary} libraryOptions={libraryOptions} setAddDataModal={setAddDataModal} selectedLocation={selectedLocation} setSelectedLocation={setSelectedLocation} locationOptions={locationOptions} kohaData={kohaData} handleExcelUpload={handleExcelUpload} isXlsxReady={isXlsxReady} isLoading={isLoading} />;
            case 'pre-reports':
                return <PreReportsScreen {...{ currentSessionName, error, setPage, preAnalysisReports: PRE_ANALYSIS_REPORTS_CONFIG, isXlsxReady }} />;
            case 'update-on-loan':
                return <UpdateOnLoanScreen {...{ handleOnLoanUpload, setPage, isXlsxReady, isLoading: isBulkLoading || isNavigatingToSummary }} />;
            case 'summary':
                return <SummaryScreen {...{ currentSessionName, summaryData, preAnalysisReports: PRE_ANALYSIS_REPORTS_CONFIG, postScanReports: POST_SCAN_REPORTS_CONFIG, isXlsxReady, isHtmlToImageReady }} />;
            case 'scan':
                return <ScanScreen {...{ isCameraOpen, isQrCodeReady, isCameraAllowed, setIsCameraOpen, handleCameraScan, warningModal, currentSessionName, combinedLibraries, selectedLibrary, combinedLocations, selectedLocation, barcodeInput, handleBarcodeInput, handleManualEntry, lastScanned, handleBulkUpload, isBulkLoading, setPage, scannedItems, filteredScannedItems, searchTerm, setSearchTerm, warningFilter, setWarningFilter, handleDeleteItem, handleClearAllScans }} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="font-sans">
            {isBulkLoading && <FullScreenLoader text="Toplu Barkodlar İşleniyor..." progress={bulkProgress} />}
            {isNavigatingToSummary && <FullScreenLoader text="Özet & Raporlar Ekranına Geçiliyor..." />}
            {isLoading && <FullScreenLoader text="Koha dosyası okunuyor, lütfen bekleyin..." />}
            <WarningModal isOpen={warningModal.isOpen} onClose={() => setWarningModal({ isOpen: false, title: '', warnings: [], barcode: null })} {...warningModal} />
            <ConfirmationModal isOpen={confirmationModal.isOpen} onClose={() => setConfirmationModal({ isOpen: false, message: '', onConfirm: () => {} })} {...confirmationModal} />
            <AddDataModal isOpen={addDataModal.isOpen} onClose={() => setAddDataModal({isOpen: false, type: ''})} onAdd={handleAddCustomData} type={addDataModal.type} />
            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} />
            
            <Sidebar
              page={page}
              setPage={setPage}
              currentSessionName={currentSessionName}
              selectedLibrary={selectedLibrary}
              kohaData={kohaData}
              scannedItems={scannedItems}
              isMuted={isMuted}
              setIsMuted={setIsMuted}
              isMobileMenuOpen={isMobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              onShare={() => setIsShareModalOpen(true)}
              onInstall={handleInstallClick}
              installPrompt={installPrompt}
            />
            
            <div className="md:ml-64 flex flex-col min-h-screen bg-slate-100">
                 {page !== 'permission' && (
                    <MobileHeader
                        onMenuClick={() => setMobileMenuOpen(true)}
                        pageTitle={pageTitles[page]}
                    />
                 )}
                <main className="flex-1">
                    {page === 'permission' ? (
                        <PermissionScreen onDecision={handlePermissionDecision} />
                    ) : page === 'scan' ? (
                        <div className="h-full">
                            {renderPageContent()}
                        </div>
                    ) : (
                        <div className="w-full p-4 sm:p-6 md:p-8">
                           {renderPageContent()}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
