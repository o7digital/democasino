# Keptos Casino Analytics

Primera version funcional end-to-end para importar Excel reales, validar datos, persistir historico, visualizar dashboards, exportar detalle CSV/XLSX y generar PDF ejecutivo.

## Instalacion

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Abrir `http://localhost:3000`.

Usuario demo: `admin@keptos.local` / `admin123`.

## Variables de entorno

Ver `.env.example`.

- `DATABASE_URL`: base local SQLite por defecto.
- `APP_URL`: URL usada por Playwright para renderizar PDF.
- `AUTH_SECRET`: secreto JWT de sesion.
- `DEFAULT_ADMIN_EMAIL` y `DEFAULT_ADMIN_PASSWORD`: credenciales iniciales documentales.

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
