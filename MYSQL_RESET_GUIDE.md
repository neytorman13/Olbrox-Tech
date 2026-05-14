# Guía para resetear contraseña de MySQL root en Windows

## Método 1: Usando MySQL Workbench (Recomendado)

1. Abre MySQL Workbench desde el menú Inicio
2. En la pestaña "Management", selecciona "Users and Privileges"
3. Selecciona el usuario "root" en la lista
4. En la pestaña "Login", cambia la contraseña
5. Aplica los cambios

## Método 2: Reset desde línea de comandos (Requiere permisos de administrador)

1. **Detener MySQL Service:**
   - Abre PowerShell como Administrador
   - Ejecuta: `Stop-Service MySQL80`

2. **Iniciar MySQL en modo seguro:**
   - Ejecuta: `mysqld --skip-grant-tables --user=mysql`
   - En otra ventana de PowerShell, ejecuta:
     ```
     mysql -u root
     USE mysql;
     UPDATE user SET authentication_string = PASSWORD('0550Cristopher.') WHERE User = 'root';
     FLUSH PRIVILEGES;
     EXIT;
     ```

3. **Detener MySQL y reiniciar normalmente:**
   - Detén el proceso mysqld
   - Inicia el servicio: `Start-Service MySQL80`

## Método 3: Reinstalar MySQL

Si los métodos anteriores no funcionan, considera reinstalar MySQL Server y configurar la contraseña durante la instalación.

## Verificación

Después de resetear la contraseña, ejecuta:
```bash
node scripts/setup-db.js
```

Si funciona, la aplicación podrá usar MySQL en lugar de SQLite.