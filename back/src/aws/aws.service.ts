import { Injectable, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  ObjectCannedACL,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ClientItemService } from 'src/services/clientItem.service';

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
    clientItemId: string, // <-- Agrega el clientItemId como parámetro
  ): Promise<string> {
    try {
      const clientItem = await this.clientItem.getClientItemById(clientItemId);
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: `${clientItem.id}/${filename}`, // ahora sí coincide con la URL
        Body: fileBuffer,
        ACL: ObjectCannedACL.public_read,
        ContentType: mimetype,
        ContentDisposition: 'inline',
      };

      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      console.log(`clientItem.itemType.name: ${clientItem.itemType.name}`);

      return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${clientItem.itemType.name}/${filename}`;
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
    throw new InternalServerErrorException('No se pudo eliminar el documento de AWS S3.');
  }
}
}
