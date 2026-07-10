# Resultados de importacion

Importacion ejecutada con `npm run db:seed` sobre los archivos reales de `data/raw`.

| Archivo | Tipo | Filas | Validas | Rechazadas | Estado |
|---|---:|---:|---:|---:|---|
| Reporte Mensual.xlsx | Mensual | 91 | 91 | 0 | IMPORTED |
| Villahermosa 05jun.xlsx | Diario | 230 | 230 | 0 | IMPORTED |
| Coatzacoalcos 05jun.xlsx | Diario | 214 | 214 | 0 | IMPORTED |

## KPIs recalculados

| KPI | Resultado app | Referencia PDF | Diferencia |
|---|---:|---:|---|
| Coin In total | $444,823,635 | $444.8M | Solo redondeo |
| NetWin total | $27,061,573 | $27.06M | Solo redondeo |
| Retencion ponderada | 6.08% | 6.09% | Redondeo de presentacion |
| Maquinas activas | 452 | 452 | Sin diferencia |
| Villahermosa Coin In | $261,203,778 | $261M | Solo redondeo |
| Coatzacoalcos Coin In | $183,619,857 | $184M | Solo redondeo |
| Villahermosa NetWin | $16,099,454 | $16.1M | Solo redondeo |
| Coatzacoalcos NetWin | $10,962,119 | $10.96M | Solo redondeo |
| Jugadas mensuales | 55,262,522 | 98.3M | Diferencia en la referencia; la app suma las filas reales de la columna JUGADAS |
| Alertas payout > 100% | 125 | 12 en preview HTML | Diferencia por datos reales y reglas configurables actuales |
| Alertas NetWin negativo | 125 | 8 en preview HTML | Diferencia por datos reales y reglas configurables actuales |

El PDF de referencia fue extraido con `pypdf` desde `data/raw/exemple dashboard - projet 2.pdf`; contiene las cifras `$27.06M`, `$444.8M`, `6.09%`, `98.3M`, `452`, `$16.1M` y `$10.96M`.
