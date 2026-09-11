const multer = require("multer")



const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize:20*1024*1024 // maximum file size allowed is 3mb

    }
})

module.exports=upload