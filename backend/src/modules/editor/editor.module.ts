import { Module } from '@nestjs/common'
import { EditorController } from './editor.controller'
import { EditorRepository } from './editor.repository'
import { EditorService } from './editor.service'

@Module({
  controllers: [EditorController],
  providers: [EditorRepository, EditorService],
  exports: [EditorService]
})
export class EditorModule {}
