import { Sequelize } from 'sequelize-typescript';
import * as tunnel_ssh from 'tunnel-ssh';
import dotenv from 'dotenv';
import { Admin } from '@/models/Admin.model';
import { Categorias_Recursos_Electronicos } from '@/models/Categorias_Recursos_Electronicos.model';
import { Eventos } from '@/models/Eventos.model';
import { Recursos_Electronicos } from '@/models/Recursos_Electronicos.model';
import { Rel_Categorias_Recursos_Electronicos } from '@/models/Rel_Categorias_Recursos_Electronicos.model';
import { Slider_Hero } from '@/models/Slider_Hero.model';
import { SubEventos } from '@/models/SubEventos.model';
import { setupRelations } from '@/models';

dotenv.config();

const tunnel = (tunnel_ssh as any).default || tunnel_ssh;

let sequelize: Sequelize | null = null;


const tunnelConfig = {
  username: process.env.SSH_USER,
  password: process.env.SSH_PASSWORD,
  host: process.env.SSH_HOST,
  port: +process.env.SSH_PORT!,
  dstHost: process.env.SSH_DSTHOST,
  dstPort: +process.env.SSH_DSTPORT!,
  localHost: process.env.SSH_LOCALHOST,
  localPort: +process.env.SSH_LOCALPORT!,
  keepAlive: true
};


declare global {
  var sshTunnelGlobal: any | undefined;
  var tunnelStartedGlobal: boolean | undefined;
}

const sshTunnel = global.sshTunnelGlobal;
let tunnelStarted = global.tunnelStartedGlobal;

async function createTunnel(): Promise<void> {
  if (global.tunnelStartedGlobal) return;

  // Si SSH_HOST apunta a localhost, conexion directa sin tunel
  const sshHost = process.env.SSH_HOST;
  if (!sshHost || sshHost === '127.0.0.1' || sshHost === 'localhost') {
    console.log('Conexion directa a BD local (sin tunel SSH)');
    global.tunnelStartedGlobal = true;
    return;
  }


  return new Promise((resolve, reject) => {
    global.sshTunnelGlobal = tunnel(tunnelConfig, (err: any) => {
      if (err) return reject(err);
      global.tunnelStartedGlobal = true;
      console.log('✅ SSH Tunnel established');
      resolve();
    });

    global.sshTunnelGlobal.on('error', (err: any) => {
      console.error('Tunnel error:', err);
      reject(err);
    });
  });
}

let connectPromise: Promise<Sequelize> | null = null;

export const connectDB = async (): Promise<Sequelize> => {
  // Si ya hay conexión establecida
  if (sequelize) return sequelize;

  // Si ya hay una conexión en curso, espera esa
  if (connectPromise) return connectPromise;

  // Si no hay conexión ni en curso, empieza una
  connectPromise = (async () => {
    try {
      console.log('Establishing SSH tunnel...');
      await createTunnel();

    // Determinar si usar socketPath (local) o host (remoto via tunel SSH)
    const sshHostVal = process.env.SSH_HOST || '';
    const isLocal = !sshHostVal || sshHostVal === '127.0.0.1' || sshHostVal === 'localhost';
    const seqOptions: any = {
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      dialect: 'mysql',
      dialectModule: require('mysql2'),
      pool: { max: 10, min: 0, idle: 10000 },
      retry: { max: 3, timeout: 10000 },
      models: [
        Admin,
        Categorias_Recursos_Electronicos,
        Eventos,
        Recursos_Electronicos,
        Rel_Categorias_Recursos_Electronicos,
        Slider_Hero,
        SubEventos
      ],
    };
    if (isLocal) {
      // Conexion local: usar socket Unix para evitar problemas de autenticacion TCP
      seqOptions.dialectOptions = { socketPath: '/var/run/mysqld/mysqld.sock' };
      console.log('[DB] Usando socket Unix local: /var/run/mysqld/mysqld.sock');
    } else {
      // Conexion remota via tunel SSH
      seqOptions.host = process.env.DB_HOST;
      seqOptions.port = +process.env.DB_PORT!;
      console.log(`[DB] Usando host remoto: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    }
    sequelize = new Sequelize(seqOptions);

      setupRelations();
      await sequelize.authenticate();
      await sequelize.sync();
      console.log('📦 Database connected');
      return sequelize;
      
    } catch (error) {
      console.error('Connection error:', error);
      if (global.sshTunnelGlobal) global.sshTunnelGlobal.close();
      sequelize = null;
      global.tunnelStartedGlobal = false;
      throw error;

    } finally {
      connectPromise = null; // Limpia para próximos intentos
    }
  })();

  return connectPromise;
};