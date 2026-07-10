# Keptos Casino Analytics

Primera version funcional end-to-end para importar Excel reales, validar datos, persistir historico, visualizar dashboards, exportar detalle CSV/XLSX y generar PDF ejecutivo.

## Instalacion

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Abrir `http://localhost:3000/login` y acceder con un usuario creado en Clerk.

## Variables de entorno

Ver `.env.example`.

- `DATABASE_URL`: base local SQLite por defecto.
- `APP_URL`: URL usada por Playwright para renderizar PDF.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: clave publica de la instancia Clerk.
- `CLERK_SECRET_KEY`: clave privada Clerk; nunca debe versionarse ni exponerse al cliente.
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`: ruta de acceso, `/login`.
- `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL`: destino posterior al acceso, `/`.
- `DEFAULT_ADMIN_EMAIL`: email que siempre recibe rol `ADMIN`.
- `ADMIN_EMAILS`: lista opcional de emails admin separados por coma.

## Roles Clerk

Todo usuario nuevo recibe acceso `READ_ONLY`. Para conceder permisos, definir `publicMetadata` desde el dashboard Clerk:

```json
{ "role": "ADMIN" }
```

Roles disponibles: `ADMIN`, `EXECUTIVE`, `CASINO_MANAGER`, `OPERATIONS` y `READ_ONLY`. Para limitar un gerente a una sala, usar sus codigos:

```json
{ "role": "CASINO_MANAGER", "casinoCodes": ["130"] }
```

Tambien se puede conceder `ADMIN` sin editar Clerk si el email coincide con `DEFAULT_ADMIN_EMAIL` o con una entrada de `ADMIN_EMAILS`.

## Archivos reales

Los archivos de prueba estan en `data/raw`:

- `Reporte Mensual.xlsx`
- `Villahermosa 05jun.xlsx`
- `Coatzacoalcos 05jun.xlsx`
- `exemple dashboard - projet 2.pdf`

## Comandos utiles

```bash
npm run import:excel -- data/raw/Reporte\\ Mensual.xlsx
npm test
npm run build
```

## Resultados de importacion verificados

- `Reporte Mensual.xlsx`: 91 filas, 91 validas, 0 rechazadas.
- `Villahermosa 05jun.xlsx`: 230 filas, 230 validas, 0 rechazadas.
- `Coatzacoalcos 05jun.xlsx`: 214 filas, 214 validas, 0 rechazadas.
- Totales mensuales recalculados: Coin In `$444,823,635`, NetWin `$27,061,573`, retencion ponderada `6.08%`, maquinas `452`.
- Totales diarios recalculados: Villahermosa NetWin `$453,757.84`, Coatzacoalcos NetWin `$498,034.12`.
- Alertas diarias con reglas actuales: 125 terminales con payout superior a 100% y NetWin negativo.

## Rutas principales

- `/`: dashboard interactivo.
- `/login`: autenticacion.
- `/api/import`: importacion Excel.
- `/api/export/terminals?format=csv|xlsx`: exportacion de terminales.
- `/reports/executive/print`: version A4 para PDF.
- `/api/reports/executive/pdf`: genera PDF con Playwright.
