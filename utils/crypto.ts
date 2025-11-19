import CryptoJS from 'crypto-js';

export const encrypt = (text: string, password: string): string => {
  return CryptoJS.AES.encrypt(text, password).toString();
};

export const decrypt = (ciphertext: string, password:string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || null;
  } catch (e) {
    console.error("Decryption failed:", e);
    return null;
  }
};