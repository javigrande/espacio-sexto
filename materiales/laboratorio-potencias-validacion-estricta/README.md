# Laboratorio de potencias · Espacio 6.º

- `index.html`: práctica, feedback inmediato, sin registro.
- `evaluacion.html`: evaluación, identificación por código/grupo y envío al Worker.
- `questions.json`: 20 preguntas / 5 misiones.
- `app.js`: lógica, XP, combo, nota y POST.
- `styles.css`: diseño responsive.

## Worker
POST `https://espacio-sexto-resultados.javigr77.workers.dev/api/attempts`

## activityId
`laboratorio-potencias-01`

## Datos enviados
activityId, activityTitle, studentCode, group, startedAtIso, finishedAtIso, finished, xp, comboBest, correct, answered, accuracy, score10, stage y events.

## Publicación sugerida
Subir la carpeta completa a, por ejemplo:
`/actividades/laboratorio-potencias/`

Práctica: `/actividades/laboratorio-potencias/`
Evaluación: `/actividades/laboratorio-potencias/evaluacion.html`

La versión de evaluación presupone que el Worker permite CORS desde el dominio de Espacio 6.º.
