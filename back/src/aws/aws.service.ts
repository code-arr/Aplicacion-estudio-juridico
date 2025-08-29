import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ClientItemService } from 'src/services/clientItem.service';
import { error } from 'console';

@Injectable()
export class AwsS3Service {
  private readonly s3Client: S3Client;

  // El constructor inicializa la propiedad s3Client.
  constructor(private readonly clientItem: ClientItemService) {
    const region =
      process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1';

    this.s3Client = new S3Client({
      region: region,
    });
  }

  // Este método debe estar dentro de la clase para acceder a 'this.s3Client'.
  async uploadDocument(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
    clientItemId: string,
    documentId?: string,
    audienceId?: string,
  ): Promise<string> {
    try {
      const clientItem = await this.clientItem.getClientItemById(clientItemId);

      // 1️⃣ Determinar la ruta (Key) en función de los parámetros
      let key: string | null = null;

      if (audienceId) {
        // Caso audience
        key =
          `${clientItem.itemType.section.category.name}/` +
          `${clientItem.itemType.section.name}/` +
          `${clientItem.itemType.name}/` +
          `${clientItem.title}/${documentId}`;
      } else if (documentId) {
        // Caso con documentId
        if (clientItem.category) {
          console.log(
            `Subiendo documento a S3 en la categoría: ${clientItem.category.name}`,
          );
          key = `${clientItem.category.name}/${documentId}`;
        } else if (clientItem.section) {
          console.log(
            'Subiendo documento a S3 en la sección:',
            clientItem.section.name,
          );
          key = `${clientItem.section.category.name}/${clientItem.section.name}/${documentId}`;
        } else if (clientItem.itemType) {
          console.log(
            'Subiendo documento a S3 en el tipo de ítem:',
            clientItem.itemType.name,
          );
          key = `${clientItem.itemType.section.category.name}/${clientItem.itemType.section.name}/${documentId}`;
        }
      }

      if (!key) {
        throw new Error(
          'No se pudo determinar la ruta (Key) para el archivo en S3',
        );
      }

      // 2️⃣ Parámetros de S3 (reutilizables)
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ACL: ObjectCannedACL.public_read,
        ContentType: mimetype,
        ContentDisposition: 'inline',
        Metadata: { fileName: filename }, // ✅ ojo: se escribe `Metadata` (no `MetaData`)
      };

      // 3️⃣ Subida a S3
      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      // 4️⃣ Retornar URL pública
      return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
    } catch (error) {
      console.error('Error al subir documento a S3:', error);
      throw new InternalServerErrorException(
        'No se pudo subir el documento a AWS S3.',
      );
    }
  }
  async deleteDocumentByUrl(fileUrl: string): Promise<void> {
    try {
      if (!fileUrl) throw new Error('No se proporcionó la URL del archivo');

      const bucketName = process.env.AWS_S3_BUCKET_NAME;

      // Parseamos la URL para obtener el path después del host
      const url = new URL(fileUrl);
      const key = url.pathname.substring(1); // le sacamos el "/" inicial

      const deleteParams = {
        Bucket: bucketName,
        Key: key,
      };

      const command = new DeleteObjectCommand(deleteParams);
      await this.s3Client.send(command);

      console.log(`Documento eliminado correctamente de S3: ${fileUrl}`);
    } catch (error) {
      console.error('Error al eliminar documento de S3:', error);
      throw new InternalServerErrorException(
        'No se pudo eliminar el documento de AWS S3.',
      );
    }
  }
}
