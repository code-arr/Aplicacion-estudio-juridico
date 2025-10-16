import { Controller, Post, Body } from '@nestjs/common';
import { OpenSignService } from './openSign.service';


@Controller('opensign')
export class OpenSignController {
  constructor(private readonly openSignService: OpenSignService) {}

  @Post('sign')
  async createSignature(
    @Body() body: { documentUrl: string; signerEmail: string },
  ) {
    return this.openSignService.createSignatureRequest(
      body.documentUrl,
      body.signerEmail,
    );
  }
}
