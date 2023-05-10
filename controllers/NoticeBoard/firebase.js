//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const firebase_stroage = require("../../config/firebase_stroges");
initializeApp(firebase_stroage.firebaseConfig);// Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();



//**********   getNoticePDFs      *************  */

NoticePDFUrls = async (notice) => {
    const urls = [];
    const storage = getStorage();

    // Loop through all the PDFs in the notice and get their download URLs
    for (let i = 0; i < notice.pdf.length; i++) {
        const pdfRef = ref(storage, `notice/pdf/${notice.pdf[i].url}`);
        const url = await getDownloadURL(pdfRef);
        urls.push({ url, _id: notice.pdf[i]._id });
    }

    return urls;
};

exports.getNoticePDFs = async (notices) => {
    for (let i = 0; i < notices.length; i++) {
        try {
            const notice = notices[i];
            const pdfUrls = await NoticePDFUrls(notice);
            notice.pdf = pdfUrls;
        } catch (err) {
            console.error(err);
        }
    }
    return notices;
};



exports. getNoticePDFUrls = async (notice) => {
    const urls = [];
    const storage = getStorage();

    // Loop through all the PDFs in the notice and get their download URLs
    for (let i = 0; i < notice.pdf.length; i++) {
        const pdfRef = ref(storage, `notice/pdf/${notice.pdf[i].url}`);
        const url = await getDownloadURL(pdfRef);
        urls.push({ url, _id: notice.pdf[i]._id });
    }

    return urls;
};
