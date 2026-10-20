// Web Crypto API (AES-GCM) for encrypting client PII at rest
const SALT = window.crypto.getRandomValues(new Uint8Array(16));
const IV_LENGTH = 12;

async function getKey(passphrase) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        "raw",
        enc.encode(passphrase),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
    );
    return window.crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: SALT,
            iterations: 100000,
            hash: "SHA-256"
        },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

export async function encryptData(passphrase, plainText) {
    const key = await getKey(passphrase);
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoded = new TextEncoder().encode(plainText);
    const cipherText = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoded
    );
    
    // Combine IV and Ciphertext for storage
    const combined = new Uint8Array(iv.length + cipherText.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(cipherText), iv.length);
    return btoa(String.fromCharCode(...combined));
}

export async function decryptData(passphrase, base64Cipher) {
    try {
        const key = await getKey(passphrase);
        const combined = Uint8Array.from(atob(base64Cipher), c => c.charCodeAt(0));
        const iv = combined.slice(0, IV_LENGTH);
        const cipherText = combined.slice(IV_LENGTH);
        
        const decrypted = await window.crypto.subtle.decrypt(
            { name: "AES-GCM", iv: iv },
            key,
            cipherText
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        throw new Error("Decryption failed. Invalid passphrase.");
    }
}
