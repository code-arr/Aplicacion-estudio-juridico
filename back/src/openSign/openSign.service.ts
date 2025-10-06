import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class OpenSignService {
  private readonly apiUrl = 'https://sandbox.opensignlabs.com/api/app/v1.1'; // URL base correcta
  private readonly apiKey = 'test.0uBYnBP4QcXy1VArSfvy2'; // Token de prueba

  async createSignatureRequest(documentUrl: string, signerEmail: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/signature-requests`,
        {
          document_url: documentUrl,
          signers: [
            {
              email: signerEmail,
              name: 'Nombre del firmante'
            }
          ],
          title: 'Documento para firmar'
        },
        {
          headers: {
            'X-API-Token': 'test.0uBYnBP4QcXy1VArSfvy2', // ✅ CORRECTO: OpenSign exige este header
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creando firma:', error.response?.data || error.message);
      console.log(error);
      
    }
  }
}