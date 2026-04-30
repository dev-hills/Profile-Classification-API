import { SetMetadata } from '@nestjs/common';

export const SKIP_API_VERSION = 'skipApiVersion';
export const SkipApiVersion = () => SetMetadata(SKIP_API_VERSION, true);
