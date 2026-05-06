# TuPlanFácil

Landing estática para `tuplanf4cil.cl`, con marca visible `TuPlanFácil`.

## Objetivo

Captar consultas por WhatsApp de personas que quieren revisar, cotizar o mejorar su plan de Isapre en Chile.

La landing está inspirada en la arquitectura comercial de Infoisapres: formulario
arriba, promesa de comparación clara, beneficios concretos, WhatsApp como salida
rápida y textos responsables.

## Archivos principales

- `index.html`: estructura, textos, formulario, SEO básico y secciones.
- `styles.css`: identidad visual, responsive, accesibilidad y layout.
- `script.js`: links de WhatsApp y mensaje automático del formulario.
- `assets/images/`: imágenes del tiburón asesor.
- `robots.txt` y `sitemap.xml`: archivos básicos para publicación.

## Configurar WhatsApp

En `script.js`, reemplaza:

```js
whatsappNumber: "56942544093",
```

por tu número real en formato internacional, sin espacios ni signos. Ejemplo:

```js
whatsappNumber: "56912345678",
```

## Subir a Hostinger

Sube estos archivos al directorio público del dominio:

- `index.html`
- `styles.css`
- `script.js`
- `robots.txt`
- `sitemap.xml`
- carpeta `assets/`

## Próximos pasos recomendados

- Agregar tu número real de WhatsApp.
- Conectar Google Analytics, Google Ads o Meta Pixel.
- Crear una versión específica para campañas corporate si vas a mandar tráfico por empresa.
- Agregar testimonios reales cuando existan.
