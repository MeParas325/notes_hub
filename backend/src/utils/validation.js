// package imports
import validator from "validator";

// validate register data
const validateRegisterData = ({ username, password }) => {
  if (!username || !validator.isAlphanumeric(username)) {
    throw new Error("Username is not valid");
  } else if (!validator.isStrongPassword(password)) {
    throw new Error("Please enter a strong password");
  }
};

// validate video data
const validateVideoData = ({ title, uploaded_by, tags, video_link }) => {
  if (!title || !title.trim()) {
    throw new Error("Title is required");
  } else if (!uploaded_by || !uploaded_by.trim()) {
    throw new Error("Uploaded is required");
  } else if (tags.length > 5) {
    throw new Error("You can only send at most 5 tags");
  } else if (!video_link || !video_link.trim()) {
    throw new Error("Video link is not valid");
  }
};

// validate pdf data
const validatePDFData = ({title, uploaded_by, tags}) => {
  if(!title || !title.trim()) {
    throw new Error("Title is required");
  } else if(!uploaded_by || !uploaded_by.trim()) {
    throw new Error("Uploaded is required");
  } else if(JSON.parse(tags).length > 5) {
    throw new Error("You can only send at most 5 tags");
  }
}

export { validateRegisterData, validateVideoData, validatePDFData };
