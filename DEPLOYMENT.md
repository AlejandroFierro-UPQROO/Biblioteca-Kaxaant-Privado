# Biblioteca UPQROO — Documentación de Despliegue

## Descripción General

Sistema de biblioteca digital de la Universidad Politécnica de Quintana Roo.
Permite gestionar recursos electrónicos, eventos, anuncios y slider de la página principal.

- **Framework:** Next.js 15.4.6 (TypeScript)
- **Base de datos:** MySQL
- **Servidor de aplicación:** PM2 (puerto 4501)
- **Servidor web:** Apache 2 (proxy inverso)
- **URL de producción:** https://apps.upqroo.edu.mx/biblioteca

---

## Estructura del Proyecto

```
biblioteca/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── login/        # Panel de login del administrador
│   │   │   └── dash/         # Dashboard de administración
│   │   ├── api/              # API Routes de Next.js
│   │   │   ├── admin/        # Autenticación JWT
│   │   │   ├── categorias-recursos-electronicos/
│   │   │   ├── correos/
│   │   │   ├── eventos/
│   │   │   ├── recursos-electronicos/
│   │   │   ├── slider-hero/
│   │   │   └── uploads/
│   │   ├── globals.css
│   │   └── layout.tsx
│   └── models/               # Modelos Sequelize/MySQL
│       ├── Admin.model.ts
│       ├── Categorias_Recursos_Electronicos.model.ts
│       ├── Eventos.model.ts
│       ├── Recursos_Electronicos.model.ts
│       ├── Rel_Categorias_Recursos_Electronicos.model.ts
│       ├── Slider_Hero.model.ts
│       ├── SubEventos.model.ts
│       └── index.ts
├── public/                   # Archivos estáticos públicos
├── uploads/                  # Archivos subidos por usuarios (NO en git)
├── logs/                     # Logs de PM2 (NO en git)
├── .env                      # Variables de entorno (NO en git — ver abajo)
├── ecosystem.config.js       # Configuración de PM2
├── next.config.mjs           # Configuración de Next.js (basePath: /biblioteca)
└── package.json
```

---

## Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- PM2 instalado globalmente: `npm install -g pm2`
- MySQL 8.x
- Apache 2 con `mod_proxy` y `mod_proxy_http` habilitados

---

## 1. Clonar el Repositorio

```bash
cd /var/www/html
git clone <URL_DEL_REPOSITORIO> biblioteca
cd biblioteca
```

---

## 2. Instalar Dependencias

```bash
npm install
```

---

## 3. Configurar Variables de Entorno

Crear el archivo `.env` en la raíz del proyecto (NUNCA subir al repositorio):

```env
# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=biblioteca_kaxaant
DB_USER=biblioteca_kaxaant
DB_PASSWORD=<CONTRASEÑA_BD>

# JWT para autenticación del administrador
JWT_KEY=<CLAVE_JWT_SECRETA>

# URL pública del proyecto (se usa en build time)
NEXT_PUBLIC_API_URL=https://apps.upqroo.edu.mx/biblioteca
```

> **IMPORTANTE:** En el código fuente, las URLs de API están hardcodeadas como
> `https://apps.upqroo.edu.mx/biblioteca` en los archivos del panel de administración
> (`src/app/admin/login/page.tsx` y `src/app/admin/dash/page.tsx`) para garantizar
> que el build de Next.js las resuelva correctamente, independientemente de las
> variables de entorno.

---

## 4. Configurar la Base de Datos MySQL

### Crear base de datos y usuario

```sql
CREATE DATABASE biblioteca_kaxaant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'biblioteca_kaxaant'@'localhost' IDENTIFIED BY '<CONTRASEÑA>';
GRANT ALL PRIVILEGES ON biblioteca_kaxaant.* TO 'biblioteca_kaxaant'@'localhost';
FLUSH PRIVILEGES;
```

### Tabla del administrador

```sql
USE biblioteca_kaxaant;

CREATE TABLE Admin (
  ID_Admin INT AUTO_INCREMENT PRIMARY KEY,
  Usuario VARCHAR(255) NOT NULL UNIQUE,
  Password VARCHAR(255) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Crear el usuario administrador

Generar un hash bcrypt (factor 12) para la contraseña elegida:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('TU_CONTRASEÑA', 12).then(h => console.log(h));"
```

Insertar en la base de datos:

```sql
INSERT INTO Admin (Usuario, Password)
VALUES ('biblioteca@upqroo.edu.mx', '<HASH_BCRYPT_GENERADO>');
```

> **Nota:** Si el hash en la base de datos no coincide con la contraseña actual,
> actualizar con: `UPDATE Admin SET Password='<NUEVO_HASH>' WHERE Usuario='biblioteca@upqroo.edu.mx';`

---

## 5. Compilar el Proyecto

```bash
cd /var/www/html/biblioteca
npm run build
```

El build genera la carpeta `.next/` con la aplicación optimizada.
**Es obligatorio recompilar cada vez que se modifique código fuente.**

---

## 6. Configurar PM2

El archivo `ecosystem.config.js` ya contiene la configuración. Para iniciar el servicio:

```bash
# Primera vez
pm2 start ecosystem.config.js

# Reiniciar (después de cambios o rebuild)
pm2 restart biblioteca --update-env

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs biblioteca

# Configurar inicio automático en el sistema
pm2 startup
pm2 save
```

El servidor corre en el **puerto 4501** internamente.

---

## 7. Configurar Apache como Proxy Inverso

Editar el archivo de configuración del virtualhost SSL:

```
/etc/apache2/sites-available/apps-hub-ssl.conf
```

Agregar dentro del bloque `<VirtualHost *:443>`:

```apache
# Biblioteca UPQROO
ProxyPass /biblioteca http://localhost:4501/biblioteca
ProxyPassReverse /biblioteca http://localhost:4501/biblioteca
```

Verificar y recargar Apache:

```bash
apache2ctl configtest
systemctl reload apache2
```

Asegurarse de que los módulos de proxy estén habilitados:

```bash
a2enmod proxy proxy_http
systemctl restart apache2
```

---

## 8. Acceso al Panel de Administración

La ruta del login **no está enlazada públicamente** en el sitio (es intencional).

- **URL de login:** https://apps.upqroo.edu.mx/biblioteca/admin/login
- **Usuario:** biblioteca@upqroo.edu.mx
- **Contraseña:** (ver con el administrador del sistema)

Desde el dashboard se pueden gestionar:
- Recursos electrónicos y sus categorías
- Eventos y sub-eventos
- Imágenes del slider principal
- Envío de correos

---

## 9. Archivos y Carpetas Importantes No Incluidos en el Repositorio

| Elemento | Motivo |
|---|---|
| `.env` | Contiene credenciales sensibles |
| `node_modules/` | Se instala con `npm install` |
| `.next/` | Se genera con `npm run build` |
| `uploads/` | Archivos subidos por usuarios (respaldar por separado) |
| `logs/` | Logs generados por PM2 |

---

## 10. Flujo de Actualización (Producción)

```bash
cd /var/www/html/biblioteca

# 1. Obtener cambios del repositorio
git pull origin main

# 2. Instalar nuevas dependencias si las hay
npm install

# 3. Compilar
npm run build

# 4. Reiniciar el servicio
pm2 restart biblioteca --update-env

# 5. Verificar que todo funciona
curl -k -o /dev/null -w "%{http_code}" https://apps.upqroo.edu.mx/biblioteca/api/eventos/get-eventos
```

---

## 11. Comandos Útiles de Diagnóstico

```bash
# Ver estado de todos los procesos PM2
pm2 status

# Ver logs del proceso biblioteca
pm2 logs biblioteca --lines 50

# Verificar que el puerto 4501 está activo
ss -tlnp | grep 4501

# Probar endpoint directamente (sin Apache)
curl -k http://localhost:4501/biblioteca/api/eventos/get-eventos

# Probar a través de Apache (producción)
curl -k https://apps.upqroo.edu.mx/biblioteca/api/eventos/get-eventos

# Probar login vía API
curl -k -X POST https://apps.upqroo.edu.mx/biblioteca/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"biblioteca@upqroo.edu.mx","password":"TU_CONTRASEÑA"}'

# Verificar configuración de Apache
apache2ctl configtest
apache2ctl -S | grep biblioteca
```

---

## 12. Notas Técnicas Importantes

### basePath de Next.js
El proyecto tiene configurado `basePath: '/biblioteca'` en `next.config.mjs`.
Esto significa que **todas las rutas del frontend** se sirven bajo `/biblioteca/`.

### URLs hardcodeadas en el panel de administración
Los archivos `src/app/admin/login/page.tsx` y `src/app/admin/dash/page.tsx` usan la URL
hardcodeada `https://apps.upqroo.edu.mx/biblioteca` en lugar de variables de entorno.

**Razón:** Next.js embebe las variables `NEXT_PUBLIC_*` en tiempo de compilación. Si el
build se hace desde un backup o sin las variables correctamente configuradas, las URLs
quedaban como texto literal sin resolver. La URL hardcodeada garantiza el funcionamiento correcto.

**Si se migra el proyecto a otro dominio**, actualizar estas referencias en ambos archivos:
```bash
grep -rn 'apps.upqroo.edu.mx/biblioteca' /var/www/html/biblioteca/src/app/admin/
```

### Autenticación JWT
- El token JWT se almacena en `localStorage` del navegador bajo la clave `token`
- La clave secreta está en `.env` como `JWT_KEY`
- El token expira según la configuración en `src/app/api/admin/login/route.ts`

---

## Historial de Cambios Importantes

| Fecha | Cambio |
|---|---|
| Mayo 2025 | Restauración desde backup, corrección de hash bcrypt en BD |
| Mayo 2025 | Configuración de ProxyPass en Apache para /biblioteca |
| Mayo 2025 | Reescritura de login/page.tsx con URL hardcodeada |
| Mayo 2025 | Corrección de baseURL en dash/page.tsx |

---

*Documentación generada el 29 de mayo de 2025*
*Universidad Politécnica de Quintana Roo — Área de Sistemas*
