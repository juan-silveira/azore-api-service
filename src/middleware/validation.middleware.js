const { validationResult } = require('express-validator');

/**
 * Middleware para validar resultados da validação
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

/**
 * Validação de email brasileiro
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Formato de email inválido');
  }
  
  // Verificar domínios comuns brasileiros
  const commonDomains = [
    'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
    'uol.com.br', 'bol.com.br', 'ig.com.br', 'terra.com.br',
    'globo.com', 'r7.com', 'msn.com', 'live.com'
  ];
  
  const domain = email.split('@')[1];
  if (!commonDomains.includes(domain)) {
    // Verificar se é um domínio corporativo válido
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
      throw new Error('Domínio de email inválido');
    }
  }
  
  return true;
};

/**
 * Validação de CPF brasileiro
 */
const validateCPF = (cpf) => {
  // Remove caracteres não numéricos
  cpf = cpf.replace(/[^\d]/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpf.length !== 11) {
    throw new Error('CPF deve ter 11 dígitos');
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) {
    throw new Error('CPF inválido');
  }
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder < 2 ? 0 : remainder;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder < 2 ? 0 : remainder;
  
  // Verifica se os dígitos verificadores estão corretos
  if (parseInt(cpf.charAt(9)) !== digit1 || parseInt(cpf.charAt(10)) !== digit2) {
    throw new Error('CPF inválido');
  }
  
  return true;
};

/**
 * Validação de CNPJ brasileiro
 */
const validateCNPJ = (cnpj) => {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/[^\d]/g, '');
  
  // Verifica se tem 14 dígitos
  if (cnpj.length !== 14) {
    throw new Error('CNPJ deve ter 14 dígitos');
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpj)) {
    throw new Error('CNPJ inválido');
  }
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Validação do segundo dígito verificador
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cnpj.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  // Verifica se os dígitos verificadores estão corretos
  if (parseInt(cnpj.charAt(12)) !== digit1 || parseInt(cnpj.charAt(13)) !== digit2) {
    throw new Error('CNPJ inválido');
  }
  
  return true;
};

/**
 * Validação de telefone brasileiro
 */
const validatePhone = (phone) => {
  // Remove caracteres não numéricos
  phone = phone.replace(/[^\d]/g, '');
  
  // Verifica se tem entre 10 e 11 dígitos
  if (phone.length < 10 || phone.length > 11) {
    throw new Error('Telefone deve ter 10 ou 11 dígitos');
  }
  
  // Verifica se começa com DDD válido (11-99)
  const ddd = parseInt(phone.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    throw new Error('DDD inválido');
  }
  
  // Verifica se o número é válido
  const number = phone.substring(2);
  if (number.length < 8 || number.length > 9) {
    throw new Error('Número de telefone inválido');
  }
  
  return true;
};

/**
 * Validação de documento (CPF ou CNPJ)
 */
const validateDocument = (document) => {
  const cleanDoc = document.replace(/[^\d]/g, '');
  
  if (cleanDoc.length === 11) {
    return validateCPF(document);
  } else if (cleanDoc.length === 14) {
    return validateCNPJ(document);
  } else {
    throw new Error('Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)');
  }
};

/**
 * Middleware para validar tipos de arquivo
 */
const validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }
    
    const fileType = req.file.mimetype;
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Middleware para validar tamanho de arquivo
 */
const validateFileSize = (maxSizeInMB) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Nenhum arquivo enviado'
      });
    }
    
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (req.file.size > maxSizeInBytes) {
      return res.status(400).json({
        success: false,
        message: `Arquivo muito grande. Tamanho máximo: ${maxSizeInMB}MB`
      });
    }
    
    next();
  };
};

module.exports = {
  validateRequest,
  validateEmail,
  validateCPF,
  validateCNPJ,
  validatePhone,
  validateDocument,
  validateFileType,
  validateFileSize
}; 