import { createDB } from '@nublox/db'

import { env } from '$env/dynamic/private'


export const db = createDB(env);
