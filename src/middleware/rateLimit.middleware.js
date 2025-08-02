const databaseConfig = require('../config/database');

// Cache em memória para rate limiting (em produção, usar Redis)
const rateLimitCache = new Map();

/**
 * Limpa cache expirado
 */
const cleanupExpiredCache = () => {
  const now = Date.now();
  for (const [key, data] of rateLimitCache.entries()) {
    if (data.expiresAt < now) {
      rateLimitCache.delete(key);
    }
  }
};

// Limpar cache a cada 5 minutos
setInterval(cleanupExpiredCache, 5 * 60 * 1000);

/**
 * Middleware de rate limiting
 */
const rateLimiter = async (req, res, next) => {
  try {
    if (!req.client) {
      return res.status(401).json({
        success: false,
        message: 'Cliente não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const clientId = req.client.id;
    const now = Date.now();
    
    // Obter limites do cliente
    const { requestsPerMinute, requestsPerHour, requestsPerDay } = req.client.rateLimit;
    
    // Criar chaves para diferentes períodos
    const minuteKey = `${clientId}:minute:${Math.floor(now / (60 * 1000))}`;
    const hourKey = `${clientId}:hour:${Math.floor(now / (60 * 60 * 1000))}`;
    const dayKey = `${clientId}:day:${Math.floor(now / (24 * 60 * 60 * 1000))}`;
    
    // Verificar limite por minuto
    const minuteData = rateLimitCache.get(minuteKey) || { count: 0, expiresAt: now + (60 * 1000) };
    if (minuteData.count >= requestsPerMinute) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit por minuto excedido',
        error: 'RATE_LIMIT_MINUTE_EXCEEDED',
        limit: requestsPerMinute,
        resetTime: new Date(minuteData.expiresAt).toISOString()
      });
    }
    
    // Verificar limite por hora
    const hourData = rateLimitCache.get(hourKey) || { count: 0, expiresAt: now + (60 * 60 * 1000) };
    if (hourData.count >= requestsPerHour) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit por hora excedido',
        error: 'RATE_LIMIT_HOUR_EXCEEDED',
        limit: requestsPerHour,
        resetTime: new Date(hourData.expiresAt).toISOString()
      });
    }
    
    // Verificar limite por dia
    const dayData = rateLimitCache.get(dayKey) || { count: 0, expiresAt: now + (24 * 60 * 60 * 1000) };
    if (dayData.count >= requestsPerDay) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit por dia excedido',
        error: 'RATE_LIMIT_DAY_EXCEEDED',
        limit: requestsPerDay,
        resetTime: new Date(dayData.expiresAt).toISOString()
      });
    }
    
    // Incrementar contadores
    minuteData.count++;
    hourData.count++;
    dayData.count++;
    
    rateLimitCache.set(minuteKey, minuteData);
    rateLimitCache.set(hourKey, hourData);
    rateLimitCache.set(dayKey, dayData);
    
    // Adicionar headers de rate limit
    res.set({
      'X-RateLimit-Minute-Limit': requestsPerMinute,
      'X-RateLimit-Minute-Remaining': requestsPerMinute - minuteData.count,
      'X-RateLimit-Minute-Reset': new Date(minuteData.expiresAt).toISOString(),
      'X-RateLimit-Hour-Limit': requestsPerHour,
      'X-RateLimit-Hour-Remaining': requestsPerHour - hourData.count,
      'X-RateLimit-Hour-Reset': new Date(hourData.expiresAt).toISOString(),
      'X-RateLimit-Day-Limit': requestsPerDay,
      'X-RateLimit-Day-Remaining': requestsPerDay - dayData.count,
      'X-RateLimit-Day-Reset': new Date(dayData.expiresAt).toISOString()
    });
    
    next();
  } catch (error) {
    console.error('Erro no rate limiting:', error);
    // Em caso de erro, permitir a requisição
    next();
  }
};

/**
 * Middleware de rate limiting específico para operações de escrita
 */
const writeRateLimiter = async (req, res, next) => {
  try {
    if (!req.client) {
      return res.status(401).json({
        success: false,
        message: 'Cliente não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    // Para operações de escrita, usar limites mais restritivos
    const clientId = req.client.id;
    const now = Date.now();
    
    // Limites específicos para escrita (10% dos limites normais)
    const writeRequestsPerMinute = Math.max(1, Math.floor(req.client.rateLimit.requestsPerMinute * 0.1));
    const writeRequestsPerHour = Math.max(1, Math.floor(req.client.rateLimit.requestsPerHour * 0.1));
    const writeRequestsPerDay = Math.max(1, Math.floor(req.client.rateLimit.requestsPerDay * 0.1));
    
    // Criar chaves específicas para escrita
    const minuteKey = `${clientId}:write:minute:${Math.floor(now / (60 * 1000))}`;
    const hourKey = `${clientId}:write:hour:${Math.floor(now / (60 * 60 * 1000))}`;
    const dayKey = `${clientId}:write:day:${Math.floor(now / (24 * 60 * 60 * 1000))}`;
    
    // Verificar limites
    const minuteData = rateLimitCache.get(minuteKey) || { count: 0, expiresAt: now + (60 * 1000) };
    if (minuteData.count >= writeRequestsPerMinute) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit de escrita por minuto excedido',
        error: 'WRITE_RATE_LIMIT_MINUTE_EXCEEDED',
        limit: writeRequestsPerMinute,
        resetTime: new Date(minuteData.expiresAt).toISOString()
      });
    }
    
    const hourData = rateLimitCache.get(hourKey) || { count: 0, expiresAt: now + (60 * 60 * 1000) };
    if (hourData.count >= writeRequestsPerHour) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit de escrita por hora excedido',
        error: 'WRITE_RATE_LIMIT_HOUR_EXCEEDED',
        limit: writeRequestsPerHour,
        resetTime: new Date(hourData.expiresAt).toISOString()
      });
    }
    
    const dayData = rateLimitCache.get(dayKey) || { count: 0, expiresAt: now + (24 * 60 * 60 * 1000) };
    if (dayData.count >= writeRequestsPerDay) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit de escrita por dia excedido',
        error: 'WRITE_RATE_LIMIT_DAY_EXCEEDED',
        limit: writeRequestsPerDay,
        resetTime: new Date(dayData.expiresAt).toISOString()
      });
    }
    
    // Incrementar contadores
    minuteData.count++;
    hourData.count++;
    dayData.count++;
    
    rateLimitCache.set(minuteKey, minuteData);
    rateLimitCache.set(hourKey, hourData);
    rateLimitCache.set(dayKey, dayData);
    
    // Adicionar headers específicos para escrita
    res.set({
      'X-WriteRateLimit-Minute-Limit': writeRequestsPerMinute,
      'X-WriteRateLimit-Minute-Remaining': writeRequestsPerMinute - minuteData.count,
      'X-WriteRateLimit-Minute-Reset': new Date(minuteData.expiresAt).toISOString(),
      'X-WriteRateLimit-Hour-Limit': writeRequestsPerHour,
      'X-WriteRateLimit-Hour-Remaining': writeRequestsPerHour - hourData.count,
      'X-WriteRateLimit-Hour-Reset': new Date(hourData.expiresAt).toISOString(),
      'X-WriteRateLimit-Day-Limit': writeRequestsPerDay,
      'X-WriteRateLimit-Day-Remaining': writeRequestsPerDay - dayData.count,
      'X-WriteRateLimit-Day-Reset': new Date(dayData.expiresAt).toISOString()
    });
    
    next();
  } catch (error) {
    console.error('Erro no rate limiting de escrita:', error);
    next();
  }
};

/**
 * Middleware para obter estatísticas de rate limit
 */
const getRateLimitStats = async (req, res, next) => {
  try {
    if (!req.client) {
      return res.status(401).json({
        success: false,
        message: 'Cliente não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const clientId = req.client.id;
    const now = Date.now();
    
    // Obter estatísticas atuais
    const minuteKey = `${clientId}:minute:${Math.floor(now / (60 * 1000))}`;
    const hourKey = `${clientId}:hour:${Math.floor(now / (60 * 60 * 1000))}`;
    const dayKey = `${clientId}:day:${Math.floor(now / (24 * 60 * 60 * 1000))}`;
    
    const minuteData = rateLimitCache.get(minuteKey) || { count: 0, expiresAt: now + (60 * 1000) };
    const hourData = rateLimitCache.get(hourKey) || { count: 0, expiresAt: now + (60 * 60 * 1000) };
    const dayData = rateLimitCache.get(dayKey) || { count: 0, expiresAt: now + (24 * 60 * 60 * 1000) };
    
    // Adicionar estatísticas ao request
    req.rateLimitStats = {
      minute: {
        used: minuteData.count,
        limit: req.client.rateLimit.requestsPerMinute,
        remaining: req.client.rateLimit.requestsPerMinute - minuteData.count,
        resetTime: new Date(minuteData.expiresAt).toISOString()
      },
      hour: {
        used: hourData.count,
        limit: req.client.rateLimit.requestsPerHour,
        remaining: req.client.rateLimit.requestsPerHour - hourData.count,
        resetTime: new Date(hourData.expiresAt).toISOString()
      },
      day: {
        used: dayData.count,
        limit: req.client.rateLimit.requestsPerDay,
        remaining: req.client.rateLimit.requestsPerDay - dayData.count,
        resetTime: new Date(dayData.expiresAt).toISOString()
      }
    };
    
    next();
  } catch (error) {
    console.error('Erro ao obter estatísticas de rate limit:', error);
    next();
  }
};

module.exports = {
  rateLimiter,
  writeRateLimiter,
  getRateLimitStats
}; 