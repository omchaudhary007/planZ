export const verifyType = (fieldData) => {
  return (req, res, next) => {
    try {
      const fileData = req.files;
      if (!fileData) {
        return res.status(400).send({
          success: false,
          message: "File not found.",
        });
      }
      for (let field of fieldData) {
        const files = fileData[field.name] || [];
        for (let file of files) {
          if (!field.allowedType.includes(file.mimetype)) {
            return res.status(400).send({
              success: false,
              message: `${field.name} file type is invalid.`,
            });
          }
        }
      }
      next();
    } catch (error) {
      return res.status(500).send({
        success: false,
        message: "Something went wrong!",
      });
    }
  };
};

export default verifyType;
