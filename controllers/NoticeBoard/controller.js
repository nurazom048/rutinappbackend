


//! firebase
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const firebase_stroage = require("../../config/firebase_stroges");
initializeApp(firebase_stroage.firebaseConfig);// Initialize Firebase
// Get a reference to the Firebase storage bucket
const storage = getStorage();


const fb = require("./firebase")



const prisma = require('../../prisma/index')


//*************** Add notices to a notice board *******************//
exports.addNotice = async (req, res) => {
    const { noticeBoardID } = req.params;
    const { title, description } = req.body;
    const { id } = req.user;

    try {
        if (!noticeBoardID || !title)
            return res.status(404).json({ message: 'fille the requid data' });


        // find noticeboard and chack permition
        const noticeBoard = await prisma.noticeBords.findFirst({
            where: { id: noticeBoardID },
        });
        if (!noticeBoard)
            return res.status(404).json({ message: 'NoticeBoard not found' });

        if (noticeBoard.ownerID !== id)
            return res
                .status(401)
                .json({ message: 'You can only add a notice to your own noticeBoard' });



        // filename       
        const timestamp = Date.now();
        const filename = `${timestamp}-${req.file.originalname}`;
        // upload to firebase
        const metadata = { contentType: req.file.mimetype };
        const storage = getStorage(); // Get a reference to the Firebase Storage bucket
        const pdfRef = ref(storage, `notice/pdf/${filename}`); // Create a reference to the bucket




        //create notice
        const notice = await prisma.notices.create({
            data: {
                title: title,
                pdf: {
                    create: {
                        url: filename,
                    },
                },
                description,
                noticeBoardre: {
                    connect: {
                        id: noticeBoard.id,
                    },
                },
                visibility: 'public',
            },
        });

        await prisma.noticeBords.update({
            where: { id: noticeBoard.id },
            data: { notices: { connect: { id: notice.id } } },
        });
        await uploadBytes(pdfRef, req.file.buffer, metadata); // Upload the file to Firebase Storage

        res
            .status(200)
            .json({ message: 'Notice created and added successfully', notice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

//******************** AllNoticeBoard     **************************** */
exports.AllNoticeBoard = async (req, res) => {
    const { id } = req.user; // To see my uploaded noticeBoards
    const { ownerID } = req.params; // To see others' uploaded noticeBoards

    try {
        const noticeBoards = await prisma.noticeBords.findMany({
            where: { ownerID: ownerID || id },
            select: {
                id: true,
                name: true,
                description: true,
                ownerID: true,
                ac: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        image: true,
                        account_type: true,
                    },
                },
            },
        });

        res.status(500).json({ message: "success", noticeBoards });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


//*************** recent notice *******************//
exports.recentNotices = async (req, res) => {
    const { id } = req.user;

    try {
        const noticeBoards = await prisma.noticeBords.findMany({
            include: {
                notices: {
                    orderBy: { time: 'desc' },
                    include: { pdf: true },
                },
            },
        });

        const notices = noticeBoards.map((board) => board.notices).flat();

        res.status(500).json({ message: "Prisma recent notice", notices });





    } catch (error) {
        res.status(500).json({ message: error.message });
    }








}
