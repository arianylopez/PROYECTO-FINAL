# Historias de Usuario - CinemaPlus (Detalladas)

A continuación se presenta el conjunto de Historias de Usuario (HU) completamente actualizado, detallado y alineado con las funcionalidades reales implementadas en el sistema. Cumplen estrictamente con el formato exigido por la rúbrica (Como/Quiero/Para, ID, Prioridad, Módulos afectados, Estimación y Criterios de Aceptación explícitos en formato Given/When/Then). Se ha excluido la HU-06 (Dashboard) según las decisiones de alcance.

---

## ÉPICA 01: Identidad y Acceso

### HU-01: Registro de cuenta con verificación de mayoría de edad
**ID:** HU-01
**Prioridad:** Alta
**Módulos afectados:** Auth, Frontend
**Estimación:** 5 Story Points

**Como** visitante mayor de 18 años,
**Quiero** crear una cuenta en CinemaPlus proporcionando mis datos personales o utilizando mi cuenta de Google,
**Para** poder acceder a las funciones exclusivas de la plataforma como comprar entradas, guardar favoritos y recibir recomendaciones.

**Criterios de aceptación verificables:**

* **Escenario 1 - Registro exitoso tradicional:** 
  - **Given (Dado que)** soy un visitante en la página de registro de CinemaPlus,
  - **When (Cuando)** completo mis datos obligatorios (nombre, correo, contraseña segura) y una fecha de nacimiento que demuestra que soy mayor de 18 años, y envío el formulario,
  - **Then (Entonces)** el sistema procesa mi solicitud, mi cuenta es creada exitosamente en la base de datos, inicio sesión automáticamente y soy redirigido al flujo de bienvenida.

* **Escenario 2 - Bloqueo por minoría de edad en registro tradicional:** 
  - **Given (Dado que)** me encuentro completando el formulario de registro,
  - **When (Cuando)** ingreso una fecha de nacimiento que indica que tengo menos de 18 años cumplidos al día de la fecha,
  - **Then (Entonces)** el sistema deshabilita la opción de registro y me muestra un mensaje de error advirtiendo que es requisito excluyente ser mayor de edad.

* **Escenario 3 - Registro implícito vía Google OAuth:** 
  - **Given (Dado que)** soy un visitante en la pantalla de autenticación,
  - **When (Cuando)** selecciono la opción "Continuar con Google" y concedo los permisos en la ventana emergente de Google, siendo la primera vez que ingreso,
  - **Then (Entonces)** el sistema toma mi correo y nombre de Google, valida que mis datos cumplan las políticas de la plataforma, y crea una nueva cuenta vinculada automáticamente, dándome acceso inmediato.

* **Escenario 4 - Prevención de correos duplicados:** 
  - **Given (Dado que)** estoy en el formulario de registro,
  - **When (Cuando)** intento registrar un correo electrónico que ya existe en los registros del sistema,
  - **Then (Entonces)** el sistema aborta la creación y me muestra una notificación indicando que la cuenta ya existe, sugiriendo iniciar sesión o recuperar la contraseña.

---

### HU-02: Inicio de sesión y gestión de dispositivos
**ID:** HU-02
**Prioridad:** Alta
**Módulos afectados:** Auth, Frontend
**Estimación:** 8 Story Points

**Como** usuario registrado de CinemaPlus,
**Quiero** iniciar sesión de manera ágil (con credenciales manuales o Google) y gestionar mis dispositivos activos,
**Para** acceder a mi cuenta de forma segura y garantizar que nadie más esté utilizando mi cupo de conexiones.

**Criterios de aceptación verificables:**

* **Escenario 1 - Inicio de sesión con credenciales correctas:** 
  - **Given (Dado que)** poseo una cuenta registrada y activa,
  - **When (Cuando)** ingreso mi correo y contraseña correctos en el portal de acceso y presiono entrar,
  - **Then (Entonces)** el sistema valida mis datos, emite mis credenciales temporales (tokens), me identifica en la barra de navegación superior y me redirige a la página principal.

* **Escenario 2 - Inicio de sesión veloz con Google OAuth:** 
  - **Given (Dado que)** previamente vinculé mi cuenta con Google,
  - **When (Cuando)** hago clic en el botón "Continuar con Google" en el formulario de login,
  - **Then (Entonces)** el sistema reconoce mi token de proveedor externo, me autentica sin pedirme contraseña y me permite el acceso inmediato a la plataforma.

* **Escenario 3 - Credenciales incorrectas y protección de privacidad:** 
  - **Given (Dado que)** intento ingresar a mi cuenta mediante correo y contraseña,
  - **When (Cuando)** escribo una clave errónea y presiono ingresar,
  - **Then (Entonces)** el sistema bloquea el acceso y muestra un mensaje genérico ("Correo o contraseña incorrectos") sin especificar cuál de los dos datos falló, evitando que extraños adivinen mi correo.

* **Escenario 4 - Límite máximo de dispositivos alcanzado:** 
  - **Given (Dado que)** he dejado mi sesión iniciada en 3 navegadores o dispositivos diferentes,
  - **When (Cuando)** intento iniciar sesión desde un cuarto dispositivo nuevo,
  - **Then (Entonces)** el sistema deniega temporalmente el inicio de sesión y despliega una ventana (modal) con la lista de mis dispositivos actuales, exigiéndome que desconecte (revoque) al menos uno antes de poder continuar desde el nuevo dispositivo.

---

### HU-03: Recuperación de contraseña
**ID:** HU-03
**Prioridad:** Media
**Módulos afectados:** Auth, Notificaciones (simulado por consola), Frontend
**Estimación:** 3 Story Points

**Como** usuario registrado que olvidó su contraseña,
**Quiero** solicitar un enlace de recuperación único a mi correo,
**Para** poder restablecer mi contraseña y recuperar el acceso a mis entradas e historial sin crear una nueva cuenta.

**Criterios de aceptación verificables:**

* **Escenario 1 - Solicitud de enlace segura:** 
  - **Given (Dado que)** no recuerdo mi clave y hago clic en "¿Olvidaste tu contraseña?",
  - **When (Cuando)** ingreso mi dirección de correo electrónico y solicito la recuperación,
  - **Then (Entonces)** el sistema procesa la solicitud silenciosamente y me muestra una pantalla de confirmación exitosa genérica, sin confirmarme explícitamente si el correo existe o no en el sistema para evitar filtración de usuarios reales.

* **Escenario 2 - Restablecimiento de credenciales:** 
  - **Given (Dado que)** recibí el enlace de recuperación y accedo a él dentro del tiempo válido,
  - **When (Cuando)** introduzco una nueva contraseña segura y la confirmo,
  - **Then (Entonces)** la contraseña se actualiza en el sistema, todas las sesiones abiertas en todos mis dispositivos son cerradas por motivos de seguridad, y soy redirigido al formulario de inicio de sesión.

* **Escenario 3 - Caducidad del enlace:** 
  - **Given (Dado que)** solicité un enlace de recuperación hace varias horas o ya lo utilicé una vez,
  - **When (Cuando)** intento ingresar a la pantalla de restablecimiento usando dicho enlace,
  - **Then (Entonces)** el sistema detecta que el enlace expiró o es inválido y me redirige a una pantalla de error, instándome a generar una solicitud nueva.

---

## ÉPICA 02: Panel Administrativo

### HU-04: Gestión del catálogo de películas
**ID:** HU-04
**Prioridad:** Alta
**Módulos afectados:** Admin, Catalog API
**Estimación:** 8 Story Points

**Como** Administrador de Contenido,
**Quiero** tener un panel visual para agregar, modificar y ocultar películas,
**Para** mantener la cartelera actualizada para el público sin depender de un desarrollador.

**Criterios de aceptación verificables:**

* **Escenario 1 - Alta de película nueva:** 
  - **Given (Dado que)** ingresé al panel administrativo con mi rol de administrador,
  - **When (Cuando)** accedo a la sección de películas, completo todos los campos obligatorios (título, afiche URL, géneros, clasificación, duración, fecha de estreno) y guardo,
  - **Then (Entonces)** la película se almacena permanentemente en la base de datos y su información se sincroniza automáticamente hacia la API pública para que aparezca en la página principal.

* **Escenario 2 - Edición de datos:** 
  - **Given (Dado que)** una película ya publicada tiene un error en su descripción o trailer,
  - **When (Cuando)** busco dicha película en el panel, edito el campo afectado y confirmo los cambios,
  - **Then (Entonces)** la información se actualiza de manera inmediata en la vista de detalle visible para los usuarios finales.

* **Escenario 3 - Ocultamiento (Baja lógica):** 
  - **Given (Dado que)** una película culmina su periodo de exhibición en cines,
  - **When (Cuando)** la selecciono y utilizo la acción masiva para desactivarla u ocultarla,
  - **Then (Entonces)** la película se marca como inactiva, desapareciendo inmediatamente de los listados públicos y el motor de búsqueda, pero conservando todo su historial interno de recaudación e información intacto.

---

### HU-05: Gestión de salas y programación de funciones
**ID:** HU-05
**Prioridad:** Alta
**Módulos afectados:** Admin, Business, Catalog API
**Estimación:** 8 Story Points

**Como** Administrador de Contenido,
**Quiero** crear estructuras de salas de cine y programar horarios exactos de exhibición,
**Para** que la cartelera refleje disponibilidad real y los usuarios puedan seleccionar sus lugares.

**Criterios de aceptación verificables:**

* **Escenario 1 - Generación de estructura de sala:** 
  - **Given (Dado que)** estoy en el panel administrativo de salas,
  - **When (Cuando)** creo una nueva sala especificando un nombre y su matriz de capacidad (número de filas y columnas),
  - **Then (Entonces)** el sistema genera automáticamente un mapa interno de butacas (ej. A1, A2, B1...) asociadas a dicha sala, dejándola lista para recibir funciones.

* **Escenario 2 - Programación exitosa de función:** 
  - **Given (Dado que)** tengo una película activa y una sala previamente configurada,
  - **When (Cuando)** programo una nueva función asignando la película, la sala, un precio base y un horario futuro,
  - **Then (Entonces)** la función queda programada exitosamente y aparece disponible para su visualización y compra por parte del público en la fecha designada.

* **Escenario 3 - Bloqueo de programación en el pasado:** 
  - **Given (Dado que)** estoy en el formulario de creación de una función,
  - **When (Cuando)** introduzco de manera deliberada o accidental una fecha u hora que ya transcurrió respecto al reloj del sistema,
  - **Then (Entonces)** el panel impide que guarde el registro y me arroja una alerta indicando que es imposible programar eventos en el pasado.

---

## ÉPICA 03: Catálogo y Búsqueda Pública

### HU-07: Cartelera pública principal
**ID:** HU-07
**Prioridad:** Alta
**Módulos afectados:** API Pública, Frontend
**Estimación:** 8 Story Points

**Como** visitante de CinemaPlus,
**Quiero** visualizar de forma inmediata las películas que están actualmente en exhibición,
**Para** poder explorar la oferta sin barreras y decidir qué película quiero ir a ver.

**Criterios de aceptación verificables:**

* **Escenario 1 - Presentación de películas activas:** 
  - **Given (Dado que)** abro mi navegador en la página de inicio de CinemaPlus,
  - **When (Cuando)** la página termina de renderizarse,
  - **Then (Entonces)** observo una cuadrícula o lista destacada con las portadas, títulos y la información resumida de las películas que el administrador ha marcado como activas.

* **Escenario 2 - Componentes de carga visual (Skeletons):** 
  - **Given (Dado que)** el servidor está procesando mi petición y mi conexión no es instantánea,
  - **When (Cuando)** la pantalla está esperando recibir la lista de películas,
  - **Then (Entonces)** el sistema muestra tarjetas grises o parpadeantes (skeletons) que mantienen la estructura de la página estable y evitan que la interfaz salte al cargar el contenido.

* **Escenario 3 - Respuesta ante cartelera vacía:** 
  - **Given (Dado que)** los administradores desactivaron temporalmente todas las películas,
  - **When (Cuando)** ingreso a explorar el catálogo,
  - **Then (Entonces)** la interfaz me comunica amablemente que actualmente no hay películas programadas, invitándome a revisar la página más adelante.

---

### HU-08: Búsqueda y filtrado de películas
**ID:** HU-08
**Prioridad:** Alta
**Módulos afectados:** API Pública, Frontend
**Estimación:** 5 Story Points

**Como** visitante de CinemaPlus,
**Quiero** utilizar una barra de búsqueda y filtros categóricos por género,
**Para** hallar una película concreta rápidamente sin tener que navegar por todo el catálogo visual.

**Criterios de aceptación verificables:**

* **Escenario 1 - Búsqueda progresiva:** 
  - **Given (Dado que)** me encuentro visualizando la cartelera,
  - **When (Cuando)** tecleo el título de una película en la caja de búsqueda,
  - **Then (Entonces)** el sistema filtra automáticamente las tarjetas de la cartelera en pantalla para mostrarme únicamente las películas que coincidan textualmente con mi criterio, sin requerir que recargue la página.

* **Escenario 2 - Filtrado cruzado por categorías:** 
  - **Given (Dado que)** no busco un título en particular pero me apetece un género,
  - **When (Cuando)** hago clic en la píldora de filtro "Terror",
  - **Then (Entonces)** la pantalla se actualiza y solo se presentan las películas que fueron catalogadas bajo ese género por los administradores.

* **Escenario 3 - Ausencia de resultados:** 
  - **Given (Dado que)** estoy utilizando los filtros o el buscador,
  - **When (Cuando)** ingreso un término que no coincide con nada en absoluto en el sistema,
  - **Then (Entonces)** la grilla de películas desaparece dando paso a un mensaje que indica que mi búsqueda no obtuvo resultados, permitiéndome limpiar los filtros con un clic.

---

### HU-09: Vista de detalle de película
**ID:** HU-09
**Prioridad:** Alta
**Módulos afectados:** API Pública, Frontend
**Estimación:** 5 Story Points

**Como** visitante de CinemaPlus,
**Quiero** hacer clic en una película para entrar a una página exclusiva con todos sus detalles (sinopsis, tráiler, calificaciones) y funciones programadas,
**Para** informarme en profundidad antes de tomar la decisión de comprar boletos.

**Criterios de aceptación verificables:**

* **Escenario 1 - Despliegue de información enriquecida:** 
  - **Given (Dado que)** he localizado una película de mi interés en la cartelera,
  - **When (Cuando)** hago clic sobre el afiche de dicha película,
  - **Then (Entonces)** navego a una vista dedicada que me exhibe la sinopsis completa, ficha técnica, tráiler en video, el promedio de estrellas dejado por otros usuarios y las reseñas destacadas.

* **Escenario 2 - Ocultamiento de funciones caducadas:** 
  - **Given (Dado que)** estoy explorando la vista de detalle de una película,
  - **When (Cuando)** me dirijo a la sección inferior de horarios disponibles,
  - **Then (Entonces)** el sistema únicamente me lista las funciones (salas y horas) que aún no han comenzado, ocultando por completo las funciones de fechas u horas pasadas.

* **Escenario 3 - Redirección condicionada a la compra:** 
  - **Given (Dado que)** he decidido comprar entradas para un horario específico,
  - **When (Cuando)** hago clic en el botón de compra de una función y no he iniciado sesión,
  - **Then (Entonces)** la aplicación memoriza mi intención, me envía primero a la pantalla de inicio de sesión y, una vez autenticado exitosamente, me aterriza directamente en el mapa de butacas de esa función sin tener que rehacer el proceso.

---

## ÉPICA 04: Compra de Entradas

### HU-10: Selección de butacas con reserva temporal
**ID:** HU-10
**Prioridad:** Alta
**Módulos afectados:** Business, Auth, Frontend
**Estimación:** 8 Story Points

**Como** usuario registrado mayor de edad,
**Quiero** visualizar un plano gráfico de la sala, ver qué butacas están libres y seleccionarlas,
**Para** asegurarme un buen lugar y bloquearlo temporalmente a mi nombre mientras realizo el pago.

**Criterios de aceptación verificables:**

* **Escenario 1 - Visualización interactiva del mapa:** 
  - **Given (Dado que)** he iniciado el proceso de compra para una función,
  - **When (Cuando)** la pantalla del seleccionador carga,
  - **Then (Entonces)** veo un mapa visual donde distingo claramente las butacas disponibles, las que están bloqueadas por otra persona en ese instante, y las que ya fueron compradas definitivamente.

* **Escenario 2 - Control de límite transaccional:** 
  - **Given (Dado que)** estoy seleccionando lugares en un plano con alta disponibilidad,
  - **When (Cuando)** intento marcar más de 8 butacas en la misma transacción,
  - **Then (Entonces)** el mapa me bloquea la acción visualmente y una alerta me recuerda que el sistema admite un límite máximo de 8 entradas por compra.

* **Escenario 3 - Adquisición de reserva exclusiva (Bloqueo Temporal):** 
  - **Given (Dado que)** elegí mis lugares deseados y estos se encuentran disponibles,
  - **When (Cuando)** hago clic en el botón para avanzar hacia el pago,
  - **Then (Entonces)** el sistema bloquea esos asientos a mi nombre de forma exclusiva en la base de datos temporal por exactamente 10 minutos, iniciando un reloj de cuenta regresiva en mi pantalla, e impidiendo que nadie más pueda hacer clic en ellos.

* **Escenario 4 - Expiración de inactividad:** 
  - **Given (Dado que)** me encuentro en el paso final del pago con mis lugares reservados,
  - **When (Cuando)** el reloj llega a cero porque he demorado más de 10 minutos en confirmar la tarjeta,
  - **Then (Entonces)** el sistema cancela mi progreso, expulsa mis lugares de vuelta al mercado público y me redirige a la selección indicando que mi reserva expiró.

---

### HU-11: Proceso de pago simulado con detección de tipo de tarjeta
**ID:** HU-11
**Prioridad:** Alta
**Módulos afectados:** Business, Frontend
**Estimación:** 13 Story Points

**Como** usuario con butacas bloqueadas a mi favor,
**Quiero** llenar los detalles de mi tarjeta de crédito de manera rápida con asistencia visual (o pagar mediante QR),
**Para** confirmar la compra, liquidar mi reserva y recibir mis entradas digitalizadas.

**Criterios de aceptación verificables:**

* **Escenario 1 - Identificación dinámica de la tarjeta:** 
  - **Given (Dado que)** me encuentro llenando el formulario de pago final,
  - **When (Cuando)** comienzo a tipear los primeros números de mi plástico,
  - **Then (Entonces)** el campo reconoce algorítmicamente la marca (Visa, Mastercard, Amex, etc.), adapta dinámicamente el formato visual y ajusta los límites requeridos para el campo del código de seguridad (CVV) a 3 o 4 dígitos según corresponda.

* **Escenario 2 - Protección de datos erróneos en cliente (Validación Luhn):** 
  - **Given (Dado que)** estoy introduciendo mi información financiera,
  - **When (Cuando)** introduzco un número de tarjeta que no respeta la verificación matemática (fórmula de Luhn) o una fecha de vencimiento que se encuentra en el pasado,
  - **Then (Entonces)** el formulario me bloquea el botón de pago de inmediato y me subraya en rojo mis errores sin necesidad de consultar remotamente al servidor, ahorrando tiempo.

* **Escenario 3 - Culminación exitosa de la orden:** 
  - **Given (Dado que)** mi tarjeta es matemáticamente válida y mi reserva de tiempo no ha expirado,
  - **When (Cuando)** presiono el botón para pagar,
  - **Then (Entonces)** el sistema procesa mi orden, libera los bloqueos temporales, fija mis butacas como "vendidas" permanentemente y me redirige a una pantalla de éxito, generándome un comprobante de orden.

* **Escenario 4 - Método de pago con simulación QR:** 
  - **Given (Dado que)** elijo la pestaña de pago secundario,
  - **When (Cuando)** marco la opción de pagar con código QR,
  - **Then (Entonces)** el sistema despliega un código QR de demostración junto con un botón para confirmar el pago, permitiéndome finalizar la transacción sin requerir números de tarjeta.

---

### HU-12: Historial de compras
**ID:** HU-12
**Prioridad:** Media
**Módulos afectados:** Business, Frontend
**Estimación:** 5 Story Points

**Como** usuario registrado de CinemaPlus,
**Quiero** acceder a una sección privada que liste mis órdenes confirmadas,
**Para** poder consultar el detalle de mi inversión y recuperar mis códigos de entrada cuando asista al cine.

**Criterios de aceptación verificables:**

* **Escenario 1 - Consulta del historial personal:** 
  - **Given (Dado que)** accedo a mi perfil de usuario y navego hacia "Mis compras",
  - **When (Cuando)** la página realiza la consulta,
  - **Then (Entonces)** obtengo un listado cronológico descendente de todas las funciones para las que he adquirido boletos, visualizando montos, película y estados.

* **Escenario 2 - Barrera de seguridad entre usuarios:** 
  - **Given (Dado que)** estoy autenticado con mi cuenta,
  - **When (Cuando)** trato de engañar al sistema e ingreso forzadamente a la URL de un detalle de compra que le pertenece a otro usuario,
  - **Then (Entonces)** la plataforma me intercepta y muestra un error de permisos (Forbidden), impidiendo tajantemente que yo vea los tickets ajenos.

---

## ÉPICA 05: Actividad del Usuario (UGC)

### HU-13: Calificación y reseña de películas
**ID:** HU-13
**Prioridad:** Media
**Módulos afectados:** UGC, Frontend
**Estimación:** 8 Story Points

**Como** usuario registrado que ha consumido contenido,
**Quiero** dejar mi valoración en formato de estrellas y redactar comentarios sobre las películas,
**Para** ayudar a otros miembros de la plataforma y nutrir el motor de recomendaciones con mis opiniones reales.

**Criterios de aceptación verificables:**

* **Escenario 1 - Emisión de puntuación interactiva:** 
  - **Given (Dado que)** me encuentro en la página de detalle de una película tras haber iniciado sesión,
  - **When (Cuando)** pulso sobre el selector de estrellas (ej. marcando 4 de 5),
  - **Then (Entonces)** el sistema registra mi evaluación al instante, recalcula el rating general de la película, y utiliza este dato de fondo para mejorar mis futuras recomendaciones.

* **Escenario 2 - Publicación de reseñas condicionadas:** 
  - **Given (Dado que)** he otorgado una calificación de estrellas a una película,
  - **When (Cuando)** escribo mi crítica en la caja de texto y la envío,
  - **Then (Entonces)** mi reseña se añade a la base de datos de la película y se vuelve pública, apareciendo bajo la película con mi nombre asociado.

* **Escenario 3 - Bloqueo de reseña sin valoración cuantitativa:** 
  - **Given (Dado que)** estoy en la vista de detalle de una película que jamás he calificado,
  - **When (Cuando)** intento enviar un comentario de texto,
  - **Then (Entonces)** el sistema me alerta de manera proactiva requiriéndome que primero deposite mi calificación en estrellas antes de permitirme escribir.

---

### HU-14: Watchlist (Mi lista) e historial de actividad
**ID:** HU-14
**Prioridad:** Media
**Módulos afectados:** UGC, Frontend
**Estimación:** 5 Story Points

**Como** usuario entusiasta de la plataforma,
**Quiero** guardar títulos que planeo ver más adelante y revisar una línea temporal de mis acciones,
**Para** no olvidar las películas que me gustaron y mantener un control de mi interacción.

**Criterios de aceptación verificables:**

* **Escenario 1 - Agregado intuitivo a lista de seguimiento:** 
  - **Given (Dado que)** visualizo el perfil de una película en el catálogo,
  - **When (Cuando)** aprieto el botón o ícono para guardar a "Quiero ver" / "Mi lista",
  - **Then (Entonces)** el ícono cambia visualmente confirmando el éxito, y la película queda anclada permanentemente en mi sección privada de favoritos.

* **Escenario 2 - Remoción de lista de seguimiento:** 
  - **Given (Dado que)** una película ya se encuentra en mi lista de seguimiento,
  - **When (Cuando)** pulso nuevamente el mismo botón de favoritos,
  - **Then (Entonces)** la película es expulsada de mi lista de seguimiento y el ícono regresa a su estado inactivo.

* **Escenario 3 - Seguimiento de mi actividad:** 
  - **Given (Dado que)** visito la pestaña "Mi Actividad" dentro de mi perfil,
  - **When (Cuando)** el sistema recopila mi historial,
  - **Then (Entonces)** me presenta una línea de tiempo (timeline) unificada que refleja cronológicamente cuándo di una reseña, cuándo califiqué un título y qué películas he guardado recientemente.

---

## ÉPICA 06: Recomendaciones Personalizadas

### HU-16: Visualizar recomendaciones personalizadas en el inicio
**ID:** HU-16
**Prioridad:** Alta
**Módulos afectados:** Recomendaciones, Frontend
**Estimación:** 8 Story Points

**Como** usuario recurrente de CinemaPlus,
**Quiero** que la página principal me reciba con una bandeja de sugerencias curadas exclusivamente para mí,
**Para** descubrir fácilmente contenidos nuevos afines a mis gustos sin tener que usar el buscador de forma manual.

**Criterios de aceptación verificables:**

* **Escenario 1 - Carrusel curado para usuarios activos:** 
  - **Given (Dado que)** poseo un historial que incluye géneros favoritos configurados, títulos calificados o películas compradas,
  - **When (Cuando)** abro la página inicial de CinemaPlus,
  - **Then (Entonces)** el sistema calcula mis tendencias e inyecta un carrusel estelar ("Recomendadas para vos") en la cima de la pantalla, cargado de películas afines a mi consumo histórico.

* **Escenario 2 - Adaptación algorítmica para visitantes anónimos o nuevos:** 
  - **Given (Dado que)** acabo de registrarme y no tengo historial, o estoy navegando sin iniciar sesión,
  - **When (Cuando)** abro la página inicial,
  - **Then (Entonces)** la inteligencia del sistema me provee un carrusel de respaldo ("Tendencias") basado globalmente en lo más vendido y visitado recientemente por la masa de usuarios.

* **Escenario 3 - Depuración de lo ya adquirido:** 
  - **Given (Dado que)** ayer realicé una compra para ir a ver una película específica que me recomendaba el sistema,
  - **When (Cuando)** hoy recargo mi página principal,
  - **Then (Entonces)** la película que ya compré ha sido removida del carrusel de sugerencias, priorizando así espacio para contenidos que aún no he consumido.

---

### HU-17: Preferencias de géneros del usuario
**ID:** HU-17
**Prioridad:** Media
**Módulos afectados:** Recomendaciones, Auth, Frontend
**Estimación:** 5 Story Points

**Como** usuario nuevo o preexistente,
**Quiero** poder declarar manualmente mis géneros cinematográficos preferidos en mi perfil,
**Para** garantizar que mis recomendaciones sean útiles desde el primer momento en que uso el sitio.

**Criterios de aceptación verificables:**

* **Escenario 1 - Selección de afinidad inicial:** 
  - **Given (Dado que)** he creado mi cuenta con éxito,
  - **When (Cuando)** culmino el registro,
  - **Then (Entonces)** el flujo de bienvenida (onboarding) me exige o sugiere indicar mis géneros favoritos antes de soltarme en la plataforma principal.

* **Escenario 2 - Modificación e impacto instantáneo:** 
  - **Given (Dado que)** estoy en mi perfil ajustando mis intereses debido a un cambio de mis gustos cinematográficos,
  - **When (Cuando)** guardo mis nuevos géneros (hasta un máximo de 5),
  - **Then (Entonces)** el sistema destruye el caché de mis antiguas sugerencias, las re-calcula, y al volver al Home, mis recomendaciones reflejan mis nuevos intereses de forma inmediata.

---

### HU-18: Explicación de las recomendaciones
**ID:** HU-18
**Prioridad:** Media
**Módulos afectados:** Recomendaciones, Frontend
**Estimación:** 5 Story Points

**Como** usuario que observa sugerencias en su pantalla,
**Quiero** visualizar una etiqueta o nota que me explique de forma transparente el porqué el algoritmo me sugiere dicha película,
**Para** entender qué patrón de mi comportamiento generó esa recomendación y confiar en la plataforma.

**Criterios de aceptación verificables:**

* **Escenario 1 - Transparencia de algoritmo en el carrusel:** 
  - **Given (Dado que)** tengo el carrusel de sugerencias frente a mí,
  - **When (Cuando)** fijo mi vista en la tarjeta de una película recomendada,
  - **Then (Entonces)** noto en su diseño un panel informativo o etiqueta clara que me expone la causalidad (por ejemplo, "Porque te gusta la ciencia ficción", o "Porque le diste 5 estrellas a una película similar").

---

### HU-19: Feedback de recomendaciones ("No me interesa")
**ID:** HU-19
**Prioridad:** Baja
**Módulos afectados:** Recomendaciones, Frontend
**Estimación:** 5 Story Points

**Como** usuario que recibe sugerencias,
**Quiero** tener un método interactivo para descartar películas que el algoritmo cree que me gustan pero en realidad no,
**Para** refinar constantemente la certeza de mi carrusel personalizado.

**Criterios de aceptación verificables:**

* **Escenario 1 - Descarte visual de película:** 
  - **Given (Dado que)** estoy observando una película en mi lista de "Recomendadas para vos" que carece de interés para mí,
  - **When (Cuando)** localizo y presiono el botón de cerrar ("✕") en la esquina de la tarjeta,
  - **Then (Entonces)** la tarjeta se encoge visualmente y desaparece de la interfaz de manera fluida sin obligarme a recargar toda la página.

* **Escenario 2 - Exclusión futura permanente:** 
  - **Given (Dado que)** he descartado exitosamente una película usando el botón "✕",
  - **When (Cuando)** abandono la página y retorno días o semanas después a mi carrusel de sugerencias,
  - **Then (Entonces)** el sistema recuerda mi veto y se asegura de que esa película en particular jamás vuelva a infiltrarse en mi banda de recomendaciones personalizadas.
