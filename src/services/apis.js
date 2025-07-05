const BASE_URL = "https://doc-sign-server.onrender.com/api"

export const AUTH_API = {
  REGISTER: BASE_URL+ "auth/register",
  LOGIN: BASE_URL+"auth/login",
  VERIFY_OTP: BASE_URL+"auth/verify-otp",
};

export const DOCUMENT_API = {
  UPLOAD: BASE_URL+"docs/upload",
  LIST: BASE_URL+"docs",
   DELETE: (id) => BASE_URL+`docs/${id}`,
};
export const SIGNATURE_API = {
  SAVE_IMAGE: BASE_URL+"saved-signature/save",
  GET_SAVED_IMAGE: BASE_URL+"saved-signature/me",
   DELETE_SAVED_IMAGE: (index) => BASE_URL+`saved-signature/delete/${index}`,
};
export const PUBLIC_SIGNATURE_API = {
  REQUEST_LINK: BASE_URL+"public-signature/request",
  VIEW_DOCUMENT: (token) => BASE_URL+`public-signature/view/${token}`,
  CONFIRM_SIGNATURE: (token) => BASE_URL+`public-signature/confirm/${token}`,
};
