import type { INestApplication } from '@nestjs/common';
import {
  json,
  urlencoded,
  type NextFunction,
  type Request,
  type Response,
} from 'express';
import helmet from 'helmet';

export function configureHttpSecurity(app: INestApplication) {
  app.use(json({ limit: '100kb' }));
  app.use(urlencoded({ extended: true, limit: '100kb' }));
  app.use(
    helmet({
      // CSP belongs to the service that returns the React HTML document.
      contentSecurityPolicy: false,
      // HSTS requires a reviewed HTTPS/TLS deployment boundary.
      strictTransportSecurity: false,
    }),
  );
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (request.path.startsWith('/api/auth')) {
      response.setHeader('Cache-Control', 'no-store');
    }

    next();
  });
}
