import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GqlAllExceptionsFilter, GqlValidationPipe } from '@bune/common';
import { LoggerService } from '@bune/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const logger = app.get(LoggerService);

  logger.log('🚀 Starting application...');

  app.useGlobalFilters(new GqlAllExceptionsFilter());
  app.useGlobalPipes(new GqlValidationPipe());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`✅ Application is running on: http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error('❌ Application failed to start', error);
});