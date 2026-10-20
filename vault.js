// Client Profile Vault logic handling encryption/decryption on save/load
import { dbSaveClient, dbGetAllClients, dbDeleteClient } from './db.js';
import { encryptData, decryptData } from './crypto.js';

let sessionPassphrase = null;

export function setSessionPassphrase(pass) {
    sessionPassphrase = pass;
}

export async function saveClientProfile(clientObj) {
    if (!sessionPassphrase) throw new Error("Vault is locked.");
    
    // Encrypt sensitive PII & Master CV before storing
    const sensitiveString = JSON.stringify({
        targetRoles: clientObj.targetRoles,
        workAuth: clientObj.workAuth,
        masterCV: clientObj.masterCV
    });
    
    const encryptedBlob = await encryptData(sessionPassphrase, sensitiveString);
    
    const record = {
        id: clientObj.id || undefined,
        name: clientObj.name,
        encryptedData: encryptedBlob,
        updatedAt: new Date().toISOString()
    };
    
    return await dbSaveClient(record);
}

export async function getAllClientProfiles() {
    if (!sessionPassphrase) throw new Error("Vault is locked.");
    const records = await dbGetAllClients();
    const decryptedProfiles = [];
    
    for (const rec of records) {
        try {
            const decryptedJson = JSON.parse(await decryptData(sessionPassphrase, rec.encryptedData));
            decryptedProfiles.push({
                id: rec.id,
                name: rec.name,
                updatedAt: rec.updatedAt,
                ...decryptedJson
            });
        } catch (e) {
            console.warn(`Could not decrypt profile ID ${rec.id}:`, e);
        }
    }
    return decryptedProfiles;
}

export async function removeClientProfile(id) {
    return await dbDeleteClient(id);
}
