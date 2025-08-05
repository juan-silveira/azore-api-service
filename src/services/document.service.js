const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Minio = require('minio');
const sharp = require('sharp');
// Função para obter o modelo Document inicializado
const getDocumentModel = () => {
  if (!global.models || !global.models.Document) {
    throw new Error('Modelo Document não está disponível. Verifique se os modelos foram inicializados.');
  }
  return global.models.Document;
};

// Função para obter o sequelize inicializado
const getSequelize = () => {
  if (!global.sequelize) {
    throw new Error('Sequelize não está disponível. Verifique se foi inicializado.');
  }
  return global.sequelize;
};

class DocumentService {
  constructor() {
    // Configurar cliente MinIO
    this.minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
    });

    this.bucketName = process.env.MINIO_BUCKET || 'azore-documents';
    this.initializeBucket();
  }

  /**
   * Inicializar bucket se não existir
   */
  async initializeBucket() {
    try {
      const bucketExists = await this.minioClient.bucketExists(this.bucketName);
      if (!bucketExists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        console.log(`Bucket ${this.bucketName} criado com sucesso`);
        
        // Configurar política de bucket para acesso público (opcional)
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`]
            }
          ]
        };
        
        await this.minioClient.setBucketPolicy(this.bucketName, JSON.stringify(policy));
      }
    } catch (error) {
      console.error('Erro ao inicializar bucket MinIO:', error);
    }
  }

  /**
   * Gerar nome único para arquivo
   */
  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    
    return `${nameWithoutExt}_${timestamp}_${randomString}${extension}`;
  }

  /**
   * Validar tipo de arquivo
   */
  validateFileType(mimeType) {
    const allowedTypes = [
      // Imagens
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      // Documentos
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      // Arquivos compactados
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ];

    return allowedTypes.includes(mimeType);
  }

  /**
   * Otimizar imagem se necessário
   */
  async optimizeImage(buffer, mimeType) {
    if (!mimeType.startsWith('image/')) {
      return buffer;
    }

    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Se a imagem for muito grande, redimensionar
      if (metadata.width > 1920 || metadata.height > 1080) {
        image.resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Otimizar qualidade
      if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        return await image.jpeg({ quality: 85 }).toBuffer();
      } else if (mimeType === 'image/png') {
        return await image.png({ compressionLevel: 9 }).toBuffer();
      } else if (mimeType === 'image/webp') {
        return await image.webp({ quality: 85 }).toBuffer();
      }

      return await image.toBuffer();
    } catch (error) {
      console.error('Erro ao otimizar imagem:', error);
      return buffer; // Retornar original se falhar
    }
  }

  /**
   * Upload de arquivo
   */
  async uploadFile(file, clientId, userId = null, metadata = {}) {
    try {
      // Validar tipo de arquivo
      if (!this.validateFileType(file.mimetype)) {
        return {
          success: false,
          message: 'Tipo de arquivo não permitido'
        };
      }

      // Validar tamanho (máximo 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return {
          success: false,
          message: 'Arquivo muito grande. Tamanho máximo: 50MB'
        };
      }

      // Gerar nome único
      const filename = this.generateUniqueFilename(file.originalname);
      const objectName = `${clientId}/${filename}`;

      // Otimizar imagem se necessário
      let fileBuffer = file.buffer;
      if (file.mimetype.startsWith('image/')) {
        fileBuffer = await this.optimizeImage(file.buffer, file.mimetype);
      }

      // Upload para MinIO
      await this.minioClient.putObject(
        this.bucketName,
        objectName,
        fileBuffer,
        fileBuffer.length,
        {
          'Content-Type': file.mimetype,
          'Content-Disposition': `inline; filename="${file.originalname}"`
        }
      );

      // Gerar URL pública
      const url = await this.minioClient.presignedGetObject(this.bucketName, objectName, 24 * 60 * 60); // 24 horas

      // Salvar no banco de dados
      const Document = getDocumentModel();
      const document = await Document.create({
        clientId,
        userId,
        name: metadata.name || file.originalname,
        originalName: file.originalname,
        filename,
        mimeType: file.mimetype,
        size: fileBuffer.length,
        path: objectName,
        url,
        category: metadata.category || 'general',
        tags: metadata.tags || [],
        metadata: {
          ...metadata,
          originalSize: file.size,
          optimized: file.mimetype.startsWith('image/') && fileBuffer.length !== file.size
        },
        isPublic: metadata.isPublic || false,
        expiresAt: metadata.expiresAt || null
      });

      return {
        success: true,
        data: document,
        message: 'Arquivo enviado com sucesso'
      };

    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      return {
        success: false,
        message: 'Erro ao fazer upload do arquivo',
        error: error.message
      };
    }
  }

  /**
   * Listar documentos do cliente
   */
  async getDocuments(clientId, filters = {}) {
    try {
      const whereClause = {
        clientId,
        isActive: true
      };

      // Aplicar filtros
      if (filters.category) {
        whereClause.category = filters.category;
      }

      if (filters.userId) {
        whereClause.userId = filters.userId;
      }

      if (filters.isPublic !== undefined) {
        whereClause.isPublic = filters.isPublic;
      }

      const Document = getDocumentModel();
    const sequelize = getSequelize();
    const documents = await Document.findAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit: filters.limit || 50,
        offset: filters.offset || 0
      });

      return {
        success: true,
        data: documents,
        message: 'Documentos encontrados'
      };

    } catch (error) {
      console.error('Erro ao buscar documentos:', error);
      return {
        success: false,
        message: 'Erro ao buscar documentos',
        error: error.message
      };
    }
  }

  /**
   * Obter documento específico
   */
  async getDocument(documentId, clientId) {
    try {
      const Document = getDocumentModel();
      const document = await Document.findOne({
        where: {
          id: documentId,
          clientId,
          isActive: true
        }
      });

      if (!document) {
        return {
          success: false,
          message: 'Documento não encontrado'
        };
      }

      return {
        success: true,
        data: document,
        message: 'Documento encontrado'
      };

    } catch (error) {
      console.error('Erro ao buscar documento:', error);
      return {
        success: false,
        message: 'Erro ao buscar documento',
        error: error.message
      };
    }
  }

  /**
   * Atualizar documento
   */
  async updateDocument(documentId, clientId, updateData) {
    try {
      const Document = getDocumentModel();
      const document = await Document.findOne({
        where: {
          id: documentId,
          clientId,
          isActive: true
        }
      });

      if (!document) {
        return {
          success: false,
          message: 'Documento não encontrado'
        };
      }

      await document.update(updateData);

      return {
        success: true,
        data: document,
        message: 'Documento atualizado com sucesso'
      };

    } catch (error) {
      console.error('Erro ao atualizar documento:', error);
      return {
        success: false,
        message: 'Erro ao atualizar documento',
        error: error.message
      };
    }
  }

  /**
   * Deletar documento
   */
  async deleteDocument(documentId, clientId) {
    try {
      const Document = getDocumentModel();
      const document = await Document.findOne({
        where: {
          id: documentId,
          clientId,
          isActive: true
        }
      });

      if (!document) {
        return {
          success: false,
          message: 'Documento não encontrado'
        };
      }

      // Deletar do MinIO
      try {
        await this.minioClient.removeObject(this.bucketName, document.path);
      } catch (error) {
        console.error('Erro ao deletar arquivo do MinIO:', error);
      }

      // Marcar como inativo no banco
      await document.update({ isActive: false });

      return {
        success: true,
        message: 'Documento deletado com sucesso'
      };

    } catch (error) {
      console.error('Erro ao deletar documento:', error);
      return {
        success: false,
        message: 'Erro ao deletar documento',
        error: error.message
      };
    }
  }

  /**
   * Gerar URL de download
   */
  async generateDownloadUrl(documentId, clientId) {
    try {
      const Document = getDocumentModel();
      const document = await Document.findOne({
        where: {
          id: documentId,
          clientId,
          isActive: true
        }
      });

      if (!document) {
        return {
          success: false,
          message: 'Documento não encontrado'
        };
      }

      // Verificar se expirou
      if (document.expiresAt && new Date() > document.expiresAt) {
        return {
          success: false,
          message: 'Documento expirado'
        };
      }

      // Gerar URL de download
      const downloadUrl = await this.minioClient.presignedGetObject(
        this.bucketName,
        document.path,
        60 * 60 // 1 hora
      );

      // Atualizar estatísticas
      await document.update({
        downloadCount: document.downloadCount + 1,
        lastDownloaded: new Date()
      });

      return {
        success: true,
        data: {
          downloadUrl,
          document
        },
        message: 'URL de download gerada'
      };

    } catch (error) {
      console.error('Erro ao gerar URL de download:', error);
      return {
        success: false,
        message: 'Erro ao gerar URL de download',
        error: error.message
      };
    }
  }

  /**
   * Obter estatísticas de documentos
   */
  async getDocumentStats(clientId) {
    try {
      const Document = getDocumentModel();
      const sequelize = getSequelize();
      const stats = await Document.findAll({
        where: { clientId, isActive: true },
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
          [sequelize.fn('SUM', sequelize.col('size')), 'totalSize'],
          [sequelize.fn('SUM', sequelize.col('downloadCount')), 'totalDownloads'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "isPublic" = true THEN 1 ELSE 0 END')), 'public'],
          [sequelize.fn('COUNT', sequelize.literal('CASE WHEN "expiresAt" IS NOT NULL AND "expiresAt" < NOW() THEN 1 ELSE 0 END')), 'expired']
        ],
        raw: true
      });

      return {
        success: true,
        data: stats[0] || {
          total: 0,
          totalSize: 0,
          totalDownloads: 0,
          public: 0,
          expired: 0
        }
      };

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        success: false,
        message: 'Erro ao buscar estatísticas',
        error: error.message
      };
    }
  }

  /**
   * Limpar documentos expirados
   */
  async cleanupExpiredDocuments() {
    try {
      const Document = getDocumentModel();
      const expiredDocuments = await Document.findAll({
        where: {
          expiresAt: {
            [sequelize.Op.lt]: new Date()
          },
          isActive: true
        }
      });

      let deletedCount = 0;

      for (const document of expiredDocuments) {
        try {
          // Deletar do MinIO
          await this.minioClient.removeObject(this.bucketName, document.path);
          
          // Marcar como inativo
          await document.update({ isActive: false });
          
          deletedCount++;
        } catch (error) {
          console.error(`Erro ao deletar documento expirado ${document.id}:`, error);
        }
      }

      return {
        success: true,
        message: `${deletedCount} documentos expirados removidos`,
        deletedCount
      };

    } catch (error) {
      console.error('Erro ao limpar documentos expirados:', error);
      return {
        success: false,
        message: 'Erro ao limpar documentos expirados',
        error: error.message
      };
    }
  }
}

module.exports = new DocumentService(); 