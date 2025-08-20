// QR-коды API
export const API = {
  // Получить все QR-коды
  GET_ALL_QRCODES: '/api/qrcode',
  
  // Получить QR-код по ID
  GET_QRCODE: (id: number) => `/api/qrcode/${id}`,
  
  // Получить QR-коды мечети
  GET_MOSQUE_QRCODES: (mosqueId: number) => `/api/qrcode/by-mosque/${mosqueId}`,
  
  // Создать QR-код
  CREATE_QRCODE: '/api/qrcode',
  
  // Обновить QR-код
  UPDATE_QRCODE: (id: number) => `/api/qrcode/${id}`,
  
  // Удалить QR-код
  DELETE_QRCODE: (id: number) => `/api/qrcode/${id}`,
}; 