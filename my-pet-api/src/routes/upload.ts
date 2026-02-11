import { FastifyInstance } from 'fastify';
import cloudinary from '../lib/cloudinary.js'; 
import { prisma } from '../db.js';
import { z } from 'zod';

export async function uploadRoutes(app: FastifyInstance) {
  
  // POST /upload?petId=xxxx
  app.post('/upload', async (req, reply) => {
    // 1. Obtener el archivo del request
    const data = await req.file();
    
    if (!data) {
      return reply.status(400).send({ message: 'No se envió ningún archivo' });
    }

    // Validar que venga el ID de la mascota (lo pedimos por Query Param para facilitar)
    const { petId } = req.query as { petId: string };
    if (!petId) {
      return reply.status(400).send({ message: 'Falta el petId en la URL' });
    }

    try {
      // 2. Subir a Cloudinary usando Streams (sin guardar en disco)
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'pet-health-attachments', // Carpeta organizada en tu nube
            resource_type: 'auto', // Acepta PDF, JPG, PNG automáticamente
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        // "Pipeamos" (conectamos) el archivo entrante directo a la nube
        data.file.pipe(uploadStream);
      });

      // 3. Guardar la referencia en tu Base de Datos (Neon)
      const attachment = await prisma.attachment.create({
        data: {
          url: uploadResult.secure_url,       // URL segura (https)
          fileType: uploadResult.format || 'file', // jpg, pdf, etc.
          name: data.filename,                // Nombre original: "radiografia.pdf"
          petId: petId                        // Relación con la mascota
        }
      });

      return reply.status(201).send(attachment);

    } catch (error) {
      console.error(error);
      return reply.status(500).send({ message: 'Error al subir el archivo' });
    }
  });
}