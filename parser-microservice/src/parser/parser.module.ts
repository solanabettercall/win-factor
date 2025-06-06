import { Module } from '@nestjs/common';
import { ParserService } from './parser.service';
import { CveOldModule } from './sites/cve-old/cve-old.module';
import { CveModule } from './sites/cve/cve.module';

@Module({
  imports: [CveOldModule, CveModule],
  providers: [ParserService],
})
export class ParserModule {}
