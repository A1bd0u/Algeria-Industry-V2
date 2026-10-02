import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import { requireAuth } from '../middlewares/authMiddleware';
import { getSupabase } from '../db/supabaseClient';
import { logger } from '../utils/logger';
import { PRODUCT_BUCKET } from '../utils/storageUrl';

const router = express.Router();

const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const KYC_BUCKET = 'kyc-documents';
export { PRODUCT_BUCKET };

// kyc-documents est privé : RC, NIF et pièces d'identité ne sont jamais
// accessibles par URL publique. Le fichier est rangé sous <userId>/ et
// l'admin le consulte via une URL signée de courte durée.
const BUCKETS: Record<string, { isPrivate: boolean; allowPdf: boolean }> = {
  [KYC_BUCKET]: { isPrivate: true, allowPdf: true },
  [PRODUCT_BUCKET]: { isPrivate: false, allowPdf: true },
};

router.post('/', requireAuth, upload.single('file'), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier téléchargé' });
  }

  try {
    const { fileTypeFromBuffer } = await import('file-type');
    const fileType = await fileTypeFromBuffer(req.file.buffer);

    if (!fileType) {
      return res.status(400).json({ error: 'Type de fichier non reconnu' });
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      return res.status(400).json({ error: 'Type de fichier non autorisé. Seuls JPEG, PNG, WEBP et PDF sont acceptés.' });
    }

    const sizeInBytes = req.file.size;
    const isImage = fileType.mime.startsWith('image/');

    if (isImage && sizeInBytes > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'La taille des images ne doit pas dépasser 5 Mo.' });
    }

    if (!isImage && sizeInBytes > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'La taille des documents ne doit pas dépasser 10 Mo.' });
    }

    const requested = typeof req.query.bucket === 'string' ? req.query.bucket : KYC_BUCKET;
    const bucketName = BUCKETS[requested] ? requested : KYC_BUCKET;
    const bucket = BUCKETS[bucketName];

    const user = req.user;
    const filename = `${user.id}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileType.ext}`;

    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filename, req.file.buffer, {
         contentType: fileType.mime,
         upsert: false
      });

    if (error) {
      throw error;
    }

    if (bucket.isPrivate) {
      // Aucune URL publique : on renvoie le chemin de stockage, opaque pour le client.
      return res.json({ url: filename, path: filename, private: true });
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filename);
    return res.json({ url: publicUrlData.publicUrl, path: filename });
  } catch (e: any) {
    logger.error('Upload error', e);
    return res.status(500).json({ error: "Erreur lors de l'upload du fichier" });
  }
});

router.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
       return res.status(400).json({ error: 'Fichier trop volumineux (max 10 Mo)' });
    }
    return res.status(400).json({ error: 'Erreur lors du téléchargement du fichier' });
  }
  next(err);
});

export default router;
