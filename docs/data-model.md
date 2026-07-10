# Modelo de datos

La base contiene importaciones (`ImportBatch`), salas (`Casino`), metricas mensuales por modelo (`MonthlyMetric`), metricas diarias por terminal (`DailyTerminalMetric`), reglas (`AlertRule`), alertas calculadas (`Alert`), usuarios (`User`) y costos diarios (`CostConfig`).

La version local usa SQLite para correr sin infraestructura adicional. Para produccion, cambiar `datasource db.provider` a `postgresql`, definir `DATABASE_URL` de PostgreSQL y regenerar migraciones.
