const { body, param, query } = require('express-validator');
const { validateRequest } = require('../middleware/validation.middleware');
const documentService = require('../services/document.service');

/**
 * Upload de documento (versão simplificada)
 */
const uploadDocument = async (req, res) => {
  try {
    const { clientId } = req.user;
    const { category, tags, isPublic, expiresAt, description, filename, mimeType, size, content } = req.body;
    
    if (!filename || !mimeType || !size || !content) {
      return res.status(400).json({
        success: false,
        message: 'Dados do arquivo são obrigatórios (filename, mimeType, size, content)'
      });
    }

    // Preparar metadados
    const metadata = {
      category: category || 'geral',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      isPublic: isPublic === 'true',
      expiresAt: expiresAt || null,
      description: description || '',
      originalName: filename
    };

    // Criar objeto file simulado
    const file = {
      originalname: filename,
      mimetype: mimeType,
      size: parseInt(size),
      buffer: Buffer.from(content, 'base64')
    };

    // Upload do arquivo
    const document = await documentService.uploadFile(
      file,
      clientId,
      req.user.id,
      metadata
    );

    res.status(201).json({
      success: true,
      message: 'Documento enviado com sucesso',
      data: document
    });
  } catch (error) {
    console.error('Erro no upload de documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Listar documentos
 */
const getDocuments = async (req, res) => {
  try {
    const { clientId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      category, 
      tags, 
      isPublic,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const filters = {
      category,
      tags: tags ? tags.split(',') : undefined,
      isPublic: isPublic !== undefined ? isPublic === 'true' : undefined,
      search
    };

    const documents = await documentService.getDocuments(clientId, {
      ...filters,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obter documento específico
 */
const getDocument = async (req, res) => {
  try {
    const { clientId } = req.user;
    const { documentId } = req.params;

    const document = await documentService.getDocument(documentId, clientId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      });
    }

    res.json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Erro ao obter documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Atualizar documento
 */
const updateDocument = async (req, res) => {
  try {
    const { clientId } = req.user;
    const { documentId } = req.params;
    const { name, category, tags, isPublic, expiresAt, description } = req.body;

    const updateData = {
      name,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : undefined,
      isPublic: isPublic !== undefined ? isPublic === 'true' : undefined,
      expiresAt: expiresAt || undefined,
      description
    };

    const document = await documentService.updateDocument(documentId, clientId, updateData);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Documento atualizado com sucesso',
      data: document
    });
  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Excluir documento
 */
const deleteDocument = async (req, res) => {
  try {
    const { clientId } = req.user;
    const { documentId } = req.params;

    const deleted = await documentService.deleteDocument(documentId, clientId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Documento excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir documento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Gerar URL de download
 */
const generateDownloadUrl = async (req, res) => {
  try {
    const { clientId } = req.user;
    const { documentId } = req.params;
    const { expiresIn = 3600 } = req.query; // 1 hora por padrão

    const downloadUrl = await documentService.generateDownloadUrl(documentId, clientId, parseInt(expiresIn));

    if (!downloadUrl) {
      return res.status(404).json({
        success: false,
        message: 'Documento não encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        downloadUrl,
        expiresIn: parseInt(expiresIn)
      }
    });
  } catch (error) {
    console.error('Erro ao gerar URL de download:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Obter estatísticas de documentos
 */
const getDocumentStats = async (req, res) => {
  try {
    const { clientId } = req.user;

    const stats = await documentService.getDocumentStats(clientId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

/**
 * Limpar documentos expirados (admin)
 */
const cleanupExpiredDocuments = async (req, res) => {
  try {
    const result = await documentService.cleanupExpiredDocuments();

    res.json({
      success: true,
      message: 'Limpeza de documentos expirados concluída',
      data: result
    });
  } catch (error) {
    console.error('Erro na limpeza de documentos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  generateDownloadUrl,
  getDocumentStats,
  cleanupExpiredDocuments
}; 