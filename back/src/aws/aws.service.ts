import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class AwsS3Service {
  private readonly s3: S3Client;
  private readonly logger = new Logger(AwsS3Service.name);
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    // Región: usa AWS_S3_REGION, si no AWS_REGION, si no 'us-east-1'
    this.region = process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET_NAME || '';

    if (!this.bucket) {
      // No tiramos la app abajo: log claro y fallamos recién cuando se use S3
      this.logger.error('AWS_S3_BUCKET_NAME no está seteado. Funcionalidad S3 deshabilitada.');
    }

    // No pasamos credenciales: usa el IAM Role de la instancia (default provider chain)
    this.s3 = new S3Client({ region: this.region });
  }

  /** Helper para construir URL pública estilo virtual-hosted */
  private objectUrl(key: string): string {
    // En us-east-1 el dominio es s3.amazonaws.com; en el resto: s3.<region>.amazonaws.com
    const host = this.region === 'us-east-1' ? 's3.amazonaws.com' : `s3.${this.region}.amazonaws.com`;
    return `https://${this.bucket}.${host}/${encodeURIComponent(key)}`;
  }

  /**
   * Sube un documento a S3.
   * Si tu bucket tiene "Block Public Access" (por defecto), NO uses ACL pública.
   * Dejalo privado y serví con pre-signed URLs (recomendado).
   */
  async uploadDocument(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<string> {
    if (!this.bucket) {
      throw new InternalServerErrorException(
        'S3 no configurado: faltante AWS_S3_BUCKET_NAME.',
      );
    }

    try {
      // ✅ Opción segura (privado): sin ACL -> objeto privado
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: fileBuffer,
        ContentType: mimetype,
        ContentDisposition: 'inline',
        // ACL: 'public-read', // ❌ Evitá esto, choca con Block Public Access
      });

      await this.s3.send(command);

      // Si decides mantener objetos privados, devolvé mejor un pre-signed URL (ver nota abajo).
      return this.objectUrl(filename);
    } catch (err) {
      this.logger.error('Error subiendo a S3', err as Error);
      throw new InternalServerErrorException('No se pudo subir el documento a AWS S3.');
    }
  }
}