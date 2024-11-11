export const multerError = (err, req, res, next) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).send({
          success: false,
          message: 'File size must not exceed 1MB.',
        });
      }
      else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).send({
          success: false,
          message: `Invalid file uploaded for field: ${err.field}. Only the specified fields are allowed.`,
        });
      }
      return res.status(500).send({
        success: false,
        message: 'Something went wrong with the file upload.',
      });
    }
    else
    next();
  };
  
export default multerError;
  