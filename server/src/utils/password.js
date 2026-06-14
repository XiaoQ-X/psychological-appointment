const { randomInt } = require("crypto");

const WEAK_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "qwerty123",
  "admin123",
  "12345678",
  "11111111",
  "00000000"
]);

const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";

function passwordPolicyError(password) {
  const value = String(password || "");
  if (value.length < 8) return "新密码至少需要8位";
  if (/^\d+$/.test(value)) return "新密码不能为纯数字";
  if (WEAK_PASSWORDS.has(value.toLowerCase())) return "新密码过于简单，请更换更安全的密码";
  if (!/[A-Za-z]/.test(value) || !/[^A-Za-z0-9]/.test(value)) {
    return "新密码必须同时包含字母和特殊字符";
  }
  return "";
}

function generateTemporaryPassword(length = 12) {
  const required = [
    "ABCDEFGHJKLMNPQRSTUVWXYZ",
    "abcdefghijkmnopqrstuvwxyz",
    "23456789",
    "!@#$%"
  ].map((alphabet) => alphabet[randomInt(alphabet.length)]);

  while (required.length < length) {
    required.push(TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)]);
  }

  for (let index = required.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [required[index], required[swapIndex]] = [required[swapIndex], required[index]];
  }
  return required.join("");
}

module.exports = { generateTemporaryPassword, passwordPolicyError };
