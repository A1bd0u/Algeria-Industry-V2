import express from 'express';
import multer from 'multer';
import path from 'path';
import { requireAuth } from '../middlewares/authMiddleware';
import { getSupabase } from '../db/supabaseClient';

const router = express.Router();

const memoryStorage = multer.memoryStorage();
// Set max size to 10MB to handle the largest allowed file
const upload = multer({ 
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
});

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

router.post('/', requireAuth, upload.single('file'), async (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Aucun fichier téléchargé' });
  }

  try {
    // Determine real file type from buffer dynamically
    const { fileTypeFromBuffer } = await import('file-type');
    const fileType = await fileTypeFromBuffer(req.file.buffer);
    
    if (!fileType) {
      return res.status(400).json({ error: 'Type de fichier non reconnu' });
    }

    if (!ALLOWED_MIME_TYPES.includes(fileType.mime)) {
      return res.status(400).json({ error: 'Type de fichier non autorisé. Seuls JPEG, PNG, WEBP et PDF sont acceptés.' });
    }

    // Size limit check based on type
    const sizeInBytes = req.file.size;
    const isImage = fileType.mime.startsWith('image/');
    
    if (isImage && sizeInBytes > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'La taille des images ne doit pas dépasser 5 Mo.' });
    }

    if (!isImage && sizeInBytes > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'La taille des documents ne doit pas dépasser 10 Mo.' });
    }

    const supabase = getSupabase();

    const allowedBuckets = ['kyc-documents', 'product-images'];
    const bucketName = req.query.bucket && allowedBuckets.includes(req.query.bucket as string) 
      ? (req.query.bucket as string) 
      : 'kyc-documents';

    // Enforce correct extension based on actual type
    const ext = `.${fileType.ext}`;
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filename, req.file.buffer, {
         contentType: fileType.mime,
         upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filename);
    
    return res.json({ url: publicUrlData.publicUrl });
  } catch (e: any) {
    console.error("Supabase Upload Error:", e);
    return res.status(500).json({ error: "Erreur lors de l'upload vers Supabase Storage", details: e.message });
  }
});

router.use((err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
       return res.status(400).json({ error: 'Fichier trop volumineux (max 10 Mo)' });
    }
    return res.status(400).json({ error: 'Erreur lors du téléchargement du fichier: ' + err.message });
  }
  console.error("Upload Error Middleware:", err);
  res.status(500).json({ error: 'Upload failed', details: err.message });
});

export default router;
