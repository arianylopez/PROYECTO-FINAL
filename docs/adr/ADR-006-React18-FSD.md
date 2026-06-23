# ADR-006: React 18 y Arquitectura Feature-Sliced Design (FSD) para Frontend Principal

**Estado:** Aceptada  
**Fecha:** 2026-06-23  

## Contexto
El sistema CinemaPlus necesita demostrar visualmente todas las funcionalidades de extremo a extremo que consuman todos y cada uno de los módulos del Backend desarrollados.
La aplicación de lado cliente (Frontend) requerida en la rúbrica no puede ser simplemente un sitio web estático. Debe manejar estados altamente interactivos, comunicación en tiempo real (por ejemplo la reserva de butacas y el temporizador en pantalla), validaciones robustas y complejas (pagos con validación Luhn), administración del token JWT global y sus respectivos refrescos, manejo global de errores y ruteo seguro según estado de autenticación.

Las opciones para desarrollar este "Single Page Application" (SPA) principal eran librerías basadas en componentes como React, o frameworks sumamente estructurados y rígidos basados en convenciones como Angular.

Por otra parte, se requería una estructura arquitectónica clara, siendo el MVC clásico de frontend una opción, u optar por paradigmas más modernos para SPAs como Feature-Sliced Design (FSD).

## Decisión
Se decidió implementar el Frontend principal en **React 18** utilizando TypeScript estricto, gestionando el entorno de empaquetado y build con **Vite**. 

Para la gestión de la complejidad y arquitectura elegimos **Feature-Sliced Design (FSD)** apoyándonos en ESLint para validar estrictamente las barreras entre capas.
Para la gestión de estado global ligero usamos **Zustand**.
Para la estructuración y nomenclatura estricta del Vanilla CSS usamos **Metodología BEM (Block, Element, Modifier)**.

La jerarquía del FSD adoptada es:
- `src/app/`: Capa global. Configuración inicial, providers, resets, ruteador global.
- `src/pages/`: Vistas completas compuestas. Las páginas actúan como directores de orquesta que no contienen lógica de negocio o componentes profundos, simplemente ensamblan funcionalidades.
- `src/features/`: Unidades lógicas de negocio, encapsuladas e independientes de UI puras (ej. la Feature del carrito de compras, o la Feature de validación del formulario Login).
- `src/shared/`: Recursos globales totalmente agnósticos de negocio (UI Kits base, llamadas a la API mediante axios global, utilitarios puros como el algoritmo de tarjeta Luhn).

## Consecuencias

### Positivas
- **Escalabilidad de Gran Envergadura:** A diferencia de agrupar todo el proyecto bajo clásicas y problemáticas carpetas planas como `components` o `hooks` que tienden a convertirse en repositorios infinitos de archivos; FSD orienta la arquitectura obligando a agrupar todos los componentes asociados al "Módulo Catálogo" juntos. Esto alinea y refleja de maravilla la separación de "Monolito Modular" pensada para el backend. 
- **Zustand vs Redux:** El uso de Zustand proporciona un manejo global (para tokens Auth o control de dispositivos) que prescinde de todo el código pre-armado redundante (boilerplate) de Redux, acelerando enormemente el desarrollo.
- **Rendimiento superior con Vite:** React 18 mediante Vite garantiza empaquetados minificados muy rápidos y *Code Splitting* eficiente al poder separar el bundle de cada ruta `src/pages/` individualmente usando los componentes nativos `React.lazy` y `Suspense`. 

### Negativas
- **Curva de Aprendizaje Exigente:** El equipo debe adaptar su mentalidad habitual y asimilar rápidamente cómo clasificar lógicamente qué cosa es un *Widget*, qué es una *Feature* y qué es una mera *Entity*. Si esto no se entiende, el desarrollador tenderá a romper la jerarquía colocando componentes específicos de "Login" en un archivo genérico de "Shared".
- **Sobrecarga de validación Linter:** Fue necesario configurar plugins extras extensos de `eslint-plugin-boundaries` en CI (Continuous Integration) para poder automatizar el control estricto e impedir que una Feature inferior pudiera de pronto importar datos jerárquicamente superiores (ej. una feature Auth referenciando a la Página principal), impidiendo que se rompa el paradigma arquitectónico del proyecto de manera silenciosa.
