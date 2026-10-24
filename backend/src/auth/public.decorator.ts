import { SetMetadata } from '@nestjs/common';

export const PUBLIC_ROUTE = 'soc5.publicRoute';
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
