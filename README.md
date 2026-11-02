# Recomp 45

Plan de recomposición corporal de 12 semanas: menú diario con control de calorías, rutina de 5 días adaptada a la epicondilitis, seguimiento de peso y cintura, y coach con IA.

**Abrir la app:** https://q2lummox.github.io/recomp45/

## Instalar
- **Android (Chrome):** abre el enlace ▸ menú ⋮ ▸ *Instalar aplicación*.
- **iPhone (Safari):** abre el enlace ▸ botón Compartir ▸ *Añadir a pantalla de inicio*.

Después de la primera carga funciona sin conexión. Los cambios se sincronizan entre dispositivos cuando hay internet.

## Datos
Firebase Firestore (plan gratuito). Todo se guarda en `users/<tu uid>/` y las reglas (`firestore.rules`) solo dejan entrar a tu cuenta de Google.

## IA
El coach usa la API de Gemini con tu clave gratuita de Google AI Studio. La clave se guarda solo en el dispositivo (menú ▸ Ajustes), nunca en el repositorio ni en Firebase.

## Versiones
Novedades en [CHANGELOG.md](CHANGELOG.md).
