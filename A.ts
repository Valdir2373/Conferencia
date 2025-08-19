import { JsonwebtokenAuthTokenManager } from "./src/infra/security/tokens/JwtAuthService";

const a = new JsonwebtokenAuthTokenManager();
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImdtMjM3M2NudDgwQGdtYWlsLmNvbSIsImlhdCI6MTc1NTYzMTY2OCwiZXhwIjoxNzU1NjMyNTY4LCJqdGkiOiJkNGU5MTczYS03ZDUzLTQzMzQtYjA1MS1hZjk2YWQyOWE4YmQifQ.kfmCaAdBLQMLLJDNyZw1c2-1St2lQTlaCWR__NwlIBk";
const c = async () => {
  const b = await a.verifyTokenTimerSet(token);

  console.log(b);
};

c();

const expiresMs = 4 * 60 * 60 * 1000; // 4 horas em milissegundos
const expiresSec = expiresMs / 1000; // 4 horas em segundos para o JWT

// console.log(expiresSec);
