import multer from 'multer';

// Set up storage - can use diskStorage or memoryStorage
const storage = multer.memoryStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Directory where files will be saved
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Ensure unique file names
    }
});

// Validation + Size Limit + File Filtering
const upload = multer({
    storage: storage, // Store on disk
    limits: { fileSize: 20000000 }, // 1MB limit
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            // If file extension is not one of these
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true); // File is valid, continue processing
    }
}); 

export default upload;
