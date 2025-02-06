// src/types.ts
export interface LoginResponseSuccess {
    status: "OK";
    token: string;
  }
  
  export interface LoginResponseFailure {
    status: "failed";
    info: string;
  }
  
  export type LoginResponse = LoginResponseSuccess | LoginResponseFailure;
  