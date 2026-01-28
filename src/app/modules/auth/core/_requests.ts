import axios from "axios";
import { AuthModel, UserModel } from "./_models";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export const LOGIN_URL = `${API_URL}/login`;
export const REGISTER_URL = `${API_URL}/register`;
export const REQUEST_PASSWORD_URL = `${API_URL}/forgot_password`;
export const SSO_LOGIN_URL = `${API_URL}/sso/login`;
export const SSO_CALLBACK_URL = `${API_URL}/sso/callback`;

// Server should return AuthModel
export function login(email: string, password: string) {
  return axios.post<AuthModel>(LOGIN_URL, {
    email,
    password,
  });
}

// Server should return AuthModel
export function register(
  email: string,
  firstname: string,
  lastname: string,
  password: string,
  password_confirmation: string
) {
  return axios.post(REGISTER_URL, {
    email,
    first_name: firstname,
    last_name: lastname,
    password,
    password_confirmation,
  });
}

// Server should return object => { result: boolean } (Is Email in DB)
export function requestPassword(email: string) {
  return axios.post<{ result: boolean }>(REQUEST_PASSWORD_URL, {
    email,
  });
}

export function getSSOLoginUrl() {
  return axios.get<{ auth_url: string; message: string }>(SSO_LOGIN_URL);
}

export function ssoCallback(code: string) {
  return axios.get<AuthModel & { user_info?: any }>(`${SSO_CALLBACK_URL}?code=${code}`);
}
