export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

export const validateName = (name: string): boolean => {
  const nameRegex = /^[A-Za-z\s]+$/;
  return nameRegex.test(name);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, one letter, one number, one special character
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};
