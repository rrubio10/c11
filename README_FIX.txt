C1 PRACTICE LAB — FIX DE DESPLEGABLES E IMPORTACIÓN

Este parche corrige tres problemas:
1. Los huecos escritos como ______ no se convertían en controles interactivos.
2. El parser ignoraba los campos ITEM options=, prompt=, keyword= y base_word=.
3. El importador podía intentar crear variantes aceptadas duplicadas.

ARCHIVOS QUE DEBES SUSTITUIR EN TU REPOSITORIO:
- src/components/exam/exam-runner.tsx
- src/lib/importer/parser.ts
- src/lib/importer/import-db.ts

El archivo tests/unit/parser.test.ts es opcional, pero se recomienda subirlo.

DESPUÉS:
1. git add .
2. git commit -m "Fix exercise dropdowns and explicit item fields"
3. git push origin main
4. Espera a que Vercel termine el despliegue.
5. Importa de nuevo data/import/C1_exercises_master.txt desde Admin > Import TXT,
   o ejecuta una vez db:import en el Build Command.

IMPORTANTE:
- Los ejercicios antiguos con ______ recuperan los desplegables al desplegar el código.
- Los ejercicios nuevos deben reimportarse una vez para guardar sus opciones A-D en la base de datos.
