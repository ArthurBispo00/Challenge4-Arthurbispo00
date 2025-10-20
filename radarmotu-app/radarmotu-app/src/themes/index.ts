// src/themes/index.ts 

export const darkTheme = {
  background: '#1A1D21',
  text: '#FFFFFF',
  primary: '#22DD44',
  card: '#2C2F33',
  border: '#4F545C',
  placeholder: '#A0A0A0',
  header: '#202328',
  inactive: '#A0A0A0',
  buttonText: '#FFFFFF',
  buttonTextPrimary: '#FFFFFF', 
  info: '#3B82F6',
  warning: '#FFB020',
  danger: '#ef4444',
  buttonTextDanger: '#FFFFFF',
  success: '#34d399',
};

export const lightTheme = {
  background: '#F0F2F5',
  text: '#1A1D21',
  primary: '#1A9933',
  card: '#FFFFFF',
  border: '#D0D0D0',
  placeholder: '#65676B',
  header: '#FFFFFF',
  inactive: '#65676B',
  buttonText: '#FFFFFF',
  buttonTextPrimary: '#FFFFFF',
  info: '#2563EB',
  warning: '#F59E0B',
  danger: '#dc2626',
  buttonTextDanger: '#FFFFFF',
  success: '#16a34a',
};

export type ThemeType = typeof darkTheme;