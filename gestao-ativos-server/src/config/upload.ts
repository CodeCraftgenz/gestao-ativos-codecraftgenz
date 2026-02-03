import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from './index.js';

// Diretorio base para uploads
const UPLOAD_BASE_DIR = process.env['UPLOAD_DIR'] || path.resolve('uploads');

/**
 * Garante que o diretorio existe
 */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Gera caminho organizado por data: uploads/screenshots/2025/01/15/
 */
function getDateBasedPath(subdir: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return path.join(UPLOAD_BASE_DIR, subdir, String(year), month, day);
}

/**
 * Storage para screenshots
 * Organiza por data: uploads/screenshots/YYYY/MM/DD/device-{id}-{timestamp}.jpg
 */
const screenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = getDateBasedPath('screenshots');
    ensureDir(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // device_id vem do middleware de auth (req.device)
    const deviceId = (req as unknown as { device?: { id: number } }).device?.id || 'unknown';
    const timestamp = Date.now();
    const uniqueSuffix = Math.round(Math.random() * 1e6);
    cb(null, `device-${deviceId}-${timestamp}-${uniqueSuffix}.jpg`);
  },
});

/**
 * Filtro para aceitar apenas imagens JPEG
 */
function imageFilter(
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de arquivo nao permitido: ${file.mimetype}`));
  }
}

/**
 * Middleware Multer para upload de screenshots
 * - Limite de 2MB por imagem
 * - Apenas JPEG/PNG
 */
export const screenshotUpload = multer({
  storage: screenshotStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
  fileFilter: imageFilter,
});

/**
 * Retorna caminho relativo a partir do path absoluto
 * Usado para salvar no banco de dados
 */
export function getRelativePath(absolutePath: string): string {
  return path.relative(UPLOAD_BASE_DIR, absolutePath).replace(/\\/g, '/');
}

/**
 * Retorna path absoluto a partir do relativo
 */
export function getAbsolutePath(relativePath: string): string {
  return path.join(UPLOAD_BASE_DIR, relativePath);
}

/**
 * Deleta arquivo de screenshot
 */
export async function deleteScreenshotFile(relativePath: string): Promise<boolean> {
  try {
    const absolutePath = getAbsolutePath(relativePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao deletar screenshot:', error);
    return false;
  }
}

export { UPLOAD_BASE_DIR };
