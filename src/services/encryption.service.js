const crypto = require('crypto');

class EncryptionService {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
    this.encoding = 'hex';
    
    // Obter chave de criptografia do ambiente
    this.encryptionKey = this.getEncryptionKey();
  }

  /**
   * Obtém a chave de criptografia do ambiente
   * @returns {Buffer} Chave de criptografia
   */
  getEncryptionKey() {
    const key = process.env.ENCRYPTION_KEY;
    
    if (!key) {
      throw new Error('ENCRYPTION_KEY não configurada no ambiente');
    }

    if (key.length < this.keyLength) {
      throw new Error(`ENCRYPTION_KEY deve ter pelo menos ${this.keyLength} caracteres`);
    }

    // Usar os primeiros 32 bytes da chave
    return Buffer.from(key.substring(0, this.keyLength), 'utf8');
  }

  /**
   * Gera uma chave de criptografia segura
   * @returns {string} Chave de criptografia em hex
   */
  generateEncryptionKey() {
    return crypto.randomBytes(this.keyLength).toString(this.encoding);
  }

  /**
   * Criptografa um texto usando AES-256-GCM
   * @param {string} text - Texto para criptografar
   * @returns {string} Texto criptografado em formato base64
   */
  encrypt(text) {
    try {
      if (!text) {
        throw new Error('Texto para criptografar não pode ser vazio');
      }

      // Gerar IV (Initialization Vector) aleatório
      const iv = crypto.randomBytes(this.ivLength);
      
      // Criar cipher usando createCipheriv (método moderno)
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
      cipher.setAAD(Buffer.from('azore-blockchain-service', 'utf8')); // Additional Authenticated Data
      
      // Criptografar
      let encrypted = cipher.update(text, 'utf8', this.encoding);
      encrypted += cipher.final(this.encoding);
      
      // Obter tag de autenticação
      const tag = cipher.getAuthTag();
      
      // Combinar IV + tag + texto criptografado
      const result = Buffer.concat([iv, tag, Buffer.from(encrypted, this.encoding)]);
      
      return result.toString('base64');
    } catch (error) {
      throw new Error(`Erro ao criptografar: ${error.message}`);
    }
  }

  /**
   * Descriptografa um texto usando AES-256-GCM
   * @param {string} encryptedText - Texto criptografado em base64
   * @returns {string} Texto descriptografado
   */
  decrypt(encryptedText) {
    try {
      if (!encryptedText) {
        throw new Error('Texto criptografado não pode ser vazio');
      }

      // Converter de base64 para buffer
      const encryptedBuffer = Buffer.from(encryptedText, 'base64');
      
      // Extrair IV, tag e texto criptografado
      const iv = encryptedBuffer.subarray(0, this.ivLength);
      const tag = encryptedBuffer.subarray(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = encryptedBuffer.subarray(this.ivLength + this.tagLength);
      
      // Criar decipher usando createDecipheriv (método moderno)
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      decipher.setAAD(Buffer.from('azore-blockchain-service', 'utf8')); // Additional Authenticated Data
      decipher.setAuthTag(tag);
      
      // Descriptografar
      let decrypted = decipher.update(encrypted, this.encoding, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Erro ao descriptografar: ${error.message}`);
    }
  }

  /**
   * Criptografa uma chave privada
   * @param {string} privateKey - Chave privada para criptografar
   * @returns {string} Chave privada criptografada
   */
  encryptPrivateKey(privateKey) {
    try {
      if (!privateKey || !privateKey.startsWith('0x')) {
        throw new Error('Chave privada inválida');
      }

      return this.encrypt(privateKey);
    } catch (error) {
      throw new Error(`Erro ao criptografar chave privada: ${error.message}`);
    }
  }

  /**
   * Descriptografa uma chave privada
   * @param {string} encryptedPrivateKey - Chave privada criptografada
   * @returns {string} Chave privada descriptografada
   */
  decryptPrivateKey(encryptedPrivateKey) {
    try {
      const privateKey = this.decrypt(encryptedPrivateKey);
      
      if (!privateKey || !privateKey.startsWith('0x')) {
        throw new Error('Chave privada descriptografada inválida');
      }

      return privateKey;
    } catch (error) {
      throw new Error(`Erro ao descriptografar chave privada: ${error.message}`);
    }
  }

  /**
   * Testa a criptografia e descriptografia
   * @returns {Object} Resultado do teste
   */
  testEncryption() {
    try {
      const testData = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      // Criptografar
      const encrypted = this.encrypt(testData);
      
      // Descriptografar
      const decrypted = this.decrypt(encrypted);
      
      // Verificar se é igual
      const success = testData === decrypted;
      
      return {
        success,
        testData,
        encrypted,
        decrypted,
        message: success ? 'Criptografia funcionando corretamente' : 'Falha na criptografia'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Erro no teste de criptografia'
      };
    }
  }

  /**
   * Gera um hash seguro de uma string
   * @param {string} data - Dados para gerar hash
   * @returns {string} Hash em hex
   */
  hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Gera um salt aleatório
   * @param {number} length - Comprimento do salt
   * @returns {string} Salt em hex
   */
  generateSalt(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }
}

module.exports = new EncryptionService(); 