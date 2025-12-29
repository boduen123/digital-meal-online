export const formatAmount = (amount) => {
  const n = Number(amount) || 0;
  return n.toLocaleString();
};

export const getMinutes = (walkTime = "") => {
  const m = parseInt(String(walkTime).replace(/\D/g, ""), 10);
  return isNaN(m) ? 0 : m;
};

export const getMealCount = (planType) => {
  const map = { "Month": 30, "Half-month": 15 };
  return map[planType] || 30;
};

export const validatePhoneNumber = (phone, provider) => {
  const cleanPhone = phone.replace(/\s/g, '');
  if (cleanPhone.length !== 10) return false;

  if (provider === 'mtn') {
    return cleanPhone.startsWith('078') || cleanPhone.startsWith('079');
  } else if (provider === 'airtel') {
    return cleanPhone.startsWith('073') || cleanPhone.startsWith('072');
  }
  return false;
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};