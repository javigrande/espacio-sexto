Misión Digestiva · Ruta del alimento · VERSIÓN D1

CAMBIO PRINCIPAL
----------------
Esta versión ya no contiene alumnos ni códigos dentro del ZIP.

En evaluación:
1. El alumno introduce código y grupo.
2. La actividad llama a:
   POST /api/student/validate
3. El Worker consulta D1.
4. Solo si D1 confirma código + grupo se inicia la prueba.

El resultado final se sigue enviando a:
POST /api/attempts

Worker:
https://espacio-sexto-resultados.javigr77.workers.dev

Incluido:
WORKER_D1_VALIDACION_ALUMNO.txt
con la ruta que debe existir en el Worker.

IMPORTANTE:
La consulta SQL de ese archivo es una plantilla porque desde el ZIP de la actividad
no podemos conocer con certeza los nombres actuales de la tabla y columnas de D1.
Solo hay que adaptar esa consulta si tu esquema usa otros nombres.

Además:
- no hay lista de alumnado en JavaScript;
- no hay nombres personales incrustados;
- las columnas de relacionar se barajan independientemente;
- práctica + evaluación;
- registro completo de resultados.

activityId:
ccnn-mision-digestiva-ruta-alimento-pro
