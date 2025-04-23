import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { CveOldModule } from './sites/cve-old/cve-old.module';

@Module({
  imports: [CveOldModule],
  providers: [ParserService],
})
export class ParserModule {}
