const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_URL.split("@")[1],
    api_key: process.env.CLOUDINARY_URL.split(":")[1].replace("//", ""),
    api_secret: process.env.CLOUDINARY_URL.split(":")[2].split("@")[0],
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "pagos",
        format: async (req, file) => "jpeg",
        public_id: (req, file) => `pago_${Date.now()}`,
    },
});

const upload = multer({ storage });


module.exports = upload
