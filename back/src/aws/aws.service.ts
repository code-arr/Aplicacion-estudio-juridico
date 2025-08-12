import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { 
  S3Client, 
  PutObjectCommand,
  ObjectCannedACL 
} from '@aws-sdk/client-s3';

@Injectable()
export class AwsS3Service {
  private readonly s3Client: S3Client;

  // El constructor inicializa la propiedad s3Client.
  constructor() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_S3_REGION;

    if (!accessKeyId || !secretAccessKey || !region) {
      throw new InternalServerErrorException(
        'Faltan variables de entorno para la configuración de AWS.'
      );
    }

    this.s3Client = new S3Client({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  }

  // Este método debe estar dentro de la clase para acceder a 'this.s3Client'.
  async uploadDocument(fileBuffer: Buffer, filename: string): Promise<string> {
    try {
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: filename,
        Body: fileBuffer,
        ACL: ObjectCannedACL.public_read,
      };
      
      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${filename}`;
    } catch (error) {
      console.error('Error al subir documento a S3:', error);
      throw new InternalServerErrorException('No se pudo subir el documento a AWS S3.');
    }
  }
}