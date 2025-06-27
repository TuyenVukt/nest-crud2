import { plainToInstance } from 'class-transformer';
import { IsString, validateSync } from 'class-validator';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// const envPath = path.resolve(process.cwd(), '.env');

// if (!fs.existsSync(path.resolve('.env.production'))) {
//   console.error('No .env file found');
//   process.exit(1);
// }

if (process.env.NODE_ENV !== 'production') {
  const envPath = path.resolve(process.cwd(), '.env.production');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log(`Loaded env from ${envPath}`);
  } else {
    console.warn('No .env.production file found (running without local env)');
  }
}

class ConfigSchema {
  @IsString()
  DATABASE_URL: string;
  @IsString()
  ACCESS_TOKEN_SECRET: string;
  @IsString()
  REFRESH_TOKEN_SECRET: string;
  @IsString()
  ACCESS_TOKEN_EXPIRES_IN: string;
  @IsString()
  REFRESH_TOKEN_EXPIRES_IN: string;
  @IsString()
  SECRET_API_KEY: string;
  @IsString()
  AWS_REGION: string;
  @IsString()
  AWS_ACCESS_KEY_ID: string;
  @IsString()
  AWS_SECRET_ACCESS_KEY: string;
  @IsString()
  AWS_S3_BUCKET_NAME: string;
}

const configServer = plainToInstance(ConfigSchema, process.env, {
  enableImplicitConversion: true,
});

const errorArray = validateSync(configServer);

// console.log(e);

if (errorArray.length > 0) {
  console.log('Các giá trị trong file .env không hợp lệ!');
  const errors = errorArray.map((eItem) => ({
    property: eItem.property,
    constraints: eItem.constraints,
    value: eItem.value,
  }));
  throw new Error(JSON.stringify(errors));
}

const envConfig = configServer;

export default envConfig;
// console.log(process.env);

// const config = new ConfigSchema();

// export default config;
