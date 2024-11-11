import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';
import nameFormatter from './nameFormatter.js'


const uploadFileToCloudinary = (fileBuffer, folderName, genericFileName) => {
  
  // creating unique fileName
  const fileName = nameFormatter(`${genericFileName}${uuidv4()}`);

  // returning a uploading promise
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: folderName || "Default",
        public_id: fileName,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    ).end(fileBuffer);
  });
};


const deleteFromCloudinary=(public_id)=>{
  return cloudinary.uploader.destroy(public_id);
}
export{
  uploadFileToCloudinary,
  deleteFromCloudinary
}
