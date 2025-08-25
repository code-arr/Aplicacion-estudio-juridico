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
    /*const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;*/
    /* const region = process.env.AWS_S3_REGION; */
    const region = process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1';

    /*if (!accessKeyId || !secretAccessKey || !region) {
      throw new InternalServerErrorException(
        'Faltan variables de entorno para la configuración de AWS.'
      );
    }
    
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    
    */

    this.s3Client = new S3Client({
      region: region
    });
  }

  // Este método debe estar dentro de la clase para acceder a 'this.s3Client'.
  async uploadDocument(
    fileBuffer: Buffer, 
    filename: string,
    mimetype: string // <-- Agrega el mimetype como parámetro
  ): Promise<string> {
    try {
      const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: filename,
        Body: fileBuffer,
        ACL: ObjectCannedACL.public_read,
        ContentType: mimetype, // <-- S3 lo usa para saber qué tipo de archivo es
        ContentDisposition: 'inline' // <-- Esto le dice al navegador que lo muestre
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
