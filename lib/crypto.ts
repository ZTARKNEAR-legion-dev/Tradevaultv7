/**
 * Client-side encryption utilities for securing sensitive data in localStorage
 * Uses AES-256-GCM encryption with Web Crypto API
 */

// Generate a consistent encryption key from a seed (browser fingerprint + user session)
async function getDerivedKey(seed: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(seed),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('tradervault-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Get a device-specific seed for encryption
function getDeviceSeed(): string {
  // Use a combination of browser characteristics as seed
  // In production, you'd add more fingerprinting
  const seed = `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}`
  return seed
}

/**
 * Encrypt data for localStorage storage
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const seed = getDeviceSeed()
    const key = await getDerivedKey(seed)
    const encoder = new TextEncoder()
    const dataBuffer = encoder.encode(data)
    
    // Generate random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    )
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encryptedBuffer), iv.length)
    
    // Convert to base64 for storage
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Encryption failed:', error)
    // Fallback: return original data if encryption fails
    return data
  }
}

/**
 * Decrypt data from localStorage
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const seed = getDeviceSeed()
    const key = await getDerivedKey(seed)
    
    // Convert from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )
    
    const decoder = new TextDecoder()
    return decoder.decode(decryptedBuffer)
  } catch (error) {
    console.error('Decryption failed:', error)
    // Fallback: return original data if decryption fails
    return encryptedData
  }
}

/**
 * Secure localStorage wrapper with encryption
 */
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      const encrypted = await encryptData(value)
      localStorage.setItem(`enc_${key}`, encrypted)
    } catch (error) {
      console.error('Secure storage setItem failed:', error)
      // Fallback to regular storage
      localStorage.setItem(key, value)
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(`enc_${key}`)
      if (!encrypted) return null
      return await decryptData(encrypted)
    } catch (error) {
      console.error('Secure storage getItem failed:', error)
      // Fallback to regular storage
      return localStorage.getItem(key)
    }
  },
  
  removeItem(key: string): void {
    localStorage.removeItem(`enc_${key}`)
    localStorage.removeItem(key) // Also remove non-encrypted version
  }
}

/**
 * Export encrypted backup with password protection
 */
export async function createEncryptedBackup(data: object, password: string): Promise<string> {
  const encoder = new TextEncoder()
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 250000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const dataString = JSON.stringify(data)
  const dataBuffer = encoder.encode(dataString)
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  )
  
  // Package: version + salt + iv + encrypted data
  const version = new Uint8Array([1]) // Version 1
  const combined = new Uint8Array(1 + salt.length + iv.length + encrypted.byteLength)
  combined.set(version, 0)
  combined.set(salt, 1)
  combined.set(iv, 1 + salt.length)
  combined.set(new Uint8Array(encrypted), 1 + salt.length + iv.length)
  
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt password-protected backup
 */
export async function decryptBackup(encryptedBackup: string, password: string): Promise<object> {
  const encoder = new TextEncoder()
  const combined = Uint8Array.from(atob(encryptedBackup), c => c.charCodeAt(0))
  
  // Unpack: version + salt + iv + encrypted data
  const version = combined[0]
  if (version !== 1) throw new Error('Unsupported backup version')
  
  const salt = combined.slice(1, 17)
  const iv = combined.slice(17, 29)
  const data = combined.slice(29)
  
  // Derive key from password
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  )
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 250000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  const decoder = new TextDecoder()
  const jsonString = decoder.decode(decrypted)
  return JSON.parse(jsonString)
}
