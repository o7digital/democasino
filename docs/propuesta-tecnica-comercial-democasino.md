# Propuesta tecnica y comercial

## Proyecto: Casino Performance Center

Cliente: [Nombre del cliente]  
Proveedor: Keptos IT Services / O7 Digital  
Demo de referencia: https://democasino.vercel.app/  
Repositorio: https://github.com/o7digital/democasino  
Fecha: Julio 2026  
Moneda: USD

## 1. Objetivo

Implementar una plataforma de analitica operativa y financiera para casinos, basada en la demo presentada, que permita centralizar datos de maquinas, acceder a logs operativos por sitio, visualizar indicadores clave, detectar alertas y generar observaciones ejecutivas mediante IA integrada.

La solucion permite a la direccion y a los equipos de operacion comparar salas, revisar el rendimiento de maquinas y fabricantes, identificar terminales con comportamiento anormal y exportar reportes para seguimiento.

## 2. Alcance funcional

La plataforma incluye:

- Dashboard ejecutivo multi-casino con Coin In, NetWin, retencion, jugadas, ganancia diaria y maquinas activas.
- Analisis de performance por maquina, modelo, area y fabricante.
- Comparativo entre casinos para detectar diferencias de rendimiento por sala.
- Operacion diaria por terminal con detalle de Coin In, NetWin, payout, jugadas y alertas.
- Importacion y validacion de archivos Excel historicos u operativos.
- Exportacion de datos filtrados en CSV/XLSX.
- Generacion de PDF ejecutivo.
- Roles de usuario y control de acceso por perfil.
- Modulo IA integrado en el desarrollo para generar observaciones, riesgos y acciones recomendadas sobre los datos visibles.

## 3. Alcance tecnico por casino

Para cada casino se contempla la conexion tecnica necesaria para acceder a los logs de las maquinas:

- Instalacion o configuracion de tarjeta de red por maquina o por punto de conexion definido en sitio.
- Conexion de las maquinas a la red local del casino para lectura de logs.
- Validacion de acceso a archivos, registros o flujo de datos disponible.
- Configuracion de reglas de importacion o extraccion segun el formato entregado por el sistema de maquinas.
- Pruebas de lectura de logs y consistencia de datos.
- Integracion de la informacion en el dashboard central.
- Configuracion de filtros por casino, area, fabricante, modelo y periodo.

Nota: el alcance definitivo por sitio depende del estado de la red local, disponibilidad de puertos, permisos de acceso a logs y formato exacto de datos de las maquinas.

## 4. Arquitectura propuesta

La solucion se compone de:

- Aplicacion web Next.js desplegada en Vercel o infraestructura equivalente.
- Base de datos de produccion en PostgreSQL.
- Autenticacion y roles mediante Clerk.
- Pipeline de importacion y normalizacion de datos.
- Motor de analitica para KPIs, rankings, alertas y exportaciones.
- Servicio IA mediante Hugging Face para observaciones automaticas.
- Modulo de respaldo local para observaciones basadas en reglas cuando el servicio IA externo no responde.

## 5. Modulo IA integrado

La IA no se ofrece como producto separado. Forma parte del desarrollo del Casino Performance Center.

El modulo IA analiza los datos visibles del dashboard y genera:

- Observaciones ejecutivas por pantalla.
- Riesgos operativos principales.
- Acciones recomendadas para la siguiente semana.
- Priorizacion de terminales, modelos o salas que requieren revision.

Costo de servicio IA Hugging Face: 149 USD por mes.

Este costo corresponde al uso mensual del servicio externo de IA y se suma a la renta mensual del sistema.

## 6. Entregables

- Plataforma web configurada para el cliente.
- Conexion inicial por casino contratado.
- Dashboard con vistas ejecutivas, maquinas, fabricantes, casinos y operacion diaria.
- Importacion inicial de datos disponibles.
- Configuracion de usuarios y roles.
- Configuracion del modulo IA integrado.
- Documentacion basica de uso.
- Sesion de capacitacion remota para usuarios clave.

## 7. Plan de implementacion

Fase 1: Preparacion tecnica  
Duracion estimada: 3 a 5 dias por casino

- Revision de infraestructura local.
- Identificacion de maquinas, red, logs y formatos.
- Validacion de acceso y permisos.

Fase 2: Conexion e integracion  
Duracion estimada: 5 a 10 dias por casino

- Configuracion de tarjetas de red o puntos de acceso.
- Lectura de logs y prueba de extraccion.
- Normalizacion de datos.
- Carga inicial en la plataforma.

Fase 3: Configuracion dashboard  
Duracion estimada: 3 a 5 dias

- Parametrizacion de casinos, areas y usuarios.
- Validacion de KPIs.
- Configuracion de alertas y exportaciones.

Fase 4: Puesta en marcha  
Duracion estimada: 2 a 3 dias

- Pruebas finales con usuarios.
- Capacitacion.
- Ajustes menores.
- Activacion de operacion mensual.

## 8. Oferta comercial

### Costos de implementacion

| Concepto | Precio unitario |
| --- | ---: |
| Implementacion tecnica por casino, incluyendo conexion, validacion de logs, configuracion inicial e integracion al dashboard | 2,500 USD por casino |
| Configuracion inicial de plataforma, base de datos, autenticacion, entorno productivo y parametros generales | 1,500 USD pago unico |
| Capacitacion inicial remota para usuarios clave | Incluida |

### Renta mensual

| Concepto | Precio mensual |
| --- | ---: |
| Renta del sistema Casino Performance Center por casino | 450 USD / mes / casino |
| Servicio IA integrado via Hugging Face | 149 USD / mes |
| Soporte correctivo y monitoreo basico | Incluido en la renta mensual |

### Ejemplo para 1 casino

| Concepto | Total |
| --- | ---: |
| Implementacion tecnica 1 casino | 2,500 USD |
| Configuracion inicial plataforma | 1,500 USD |
| Total pago unico | 4,000 USD |
| Renta mensual sistema 1 casino | 450 USD / mes |
| Servicio IA Hugging Face | 149 USD / mes |
| Total mensual | 599 USD / mes |

### Ejemplo para 2 casinos

| Concepto | Total |
| --- | ---: |
| Implementacion tecnica 2 casinos | 5,000 USD |
| Configuracion inicial plataforma | 1,500 USD |
| Total pago unico | 6,500 USD |
| Renta mensual sistema 2 casinos | 900 USD / mes |
| Servicio IA Hugging Face | 149 USD / mes |
| Total mensual | 1,049 USD / mes |

## 9. Condiciones comerciales

- Precios expresados en USD, sin impuestos.
- Vigencia de la propuesta: 30 dias.
- Inicio del proyecto: contra aprobacion de propuesta y pago inicial.
- Forma de pago sugerida para implementacion: 50% al inicio y 50% contra puesta en marcha.
- La renta mensual inicia al momento de la activacion productiva del primer casino.
- Hardware, cableado, switches, tarjetas de red fisicas y trabajos electricos no estan incluidos, salvo que se coticen por separado.
- El cliente debera facilitar acceso tecnico a red, maquinas, logs y personal de soporte local.
- Cambios mayores de alcance, nuevos formatos de logs o integraciones adicionales se cotizaran por separado.

## 10. Supuestos

- El cliente cuenta con autorizacion para acceder a logs de maquinas en cada casino.
- Los sitios cuentan con conectividad local suficiente para integrar las maquinas o puntos de extraccion.
- Los formatos de datos se mantienen estables durante la implementacion.
- La plataforma se opera como servicio web centralizado.
- La IA integrada usa Hugging Face como proveedor externo.

## 11. Aprobacion

Cliente: _______________________________

Fecha: _________________________________

Firma: _________________________________
