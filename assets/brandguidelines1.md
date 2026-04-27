# Guía de Estilo de UI (Inspiración Outdoor/Aventura)

## 1. Filosofía de Diseño
El diseño se centra en la **claridad, la usabilidad y la conexión con la naturaleza**. Se utiliza un diseño limpio (clean design) con amplio espacio en blanco, colores tierra y contrastes suaves para que la información técnica (mapas, rutas, estadísticas) sea fácil de digerir.

---

## 2. Paleta de Colores

La paleta se basa en tonos orgánicos que recuerdan al bosque, la tierra y la luz natural.

### Colores Principales
* **Verde Principal (Acciones primarias):** `#4A7A30` (Aprox.)
    * *Uso:* Botones principales ("Navegar", "Nuevo"), iconos activos, elementos de marca.
* **Verde Hover (Interacciones):** `#3A6025` (Aprox.)
    * *Uso:* Estado *hover* de los botones principales.

### Colores de Fondo y Superficies
* **Fondo General (Base):** `#F9F7F2` o `#FAF8F5` (Tono crema/beige muy claro)
    * *Uso:* Fondo principal de la aplicación. Reduce la fatiga visual frente al blanco puro y da un toque orgánico.
* **Superficies (Cards):** `#FFFFFF` (Blanco puro)
    * *Uso:* Tarjetas de contenido (gráficos, clima, paneles de información). Ayuda a separar el contenido del fondo mediante la técnica de elevación (sombras sutiles).

### Colores de Acento
* **Naranja Tierra (Destacados):** `#D96A27` o `#E07A5F`
    * *Uso:* Notificaciones, iconos destacados (como el sol del clima), marcadores de ruta en el mapa o llamadas de atención secundarias.
* **Azul Ruta:** `#2B78E4`
    * *Uso:* Exclusivo para trazar el camino o la ruta principal sobre los mapas.

### Tipografía y Texto
* **Texto Principal:** `#1A1A1A` o `#2D2D2D` (Gris casi negro)
    * *Uso:* Títulos y texto de cuerpo para máxima legibilidad. No usar negro `#000000` puro.
* **Texto Secundario:** `#757575` o `#666666` (Gris medio)
    * *Uso:* Subtítulos, etiquetas (labels), métricas secundarias y texto de apoyo.

---

## 3. Tipografía

El enfoque es moderno, geométrico y altamente legible, ideal para interfaces ricas en datos.

* **Familia Tipográfica Recomendada:** `Inter`, `Roboto` o `Proxima Nova` (Sans-serif).
* **Títulos (H1, H2, H3):** * *Peso:* Bold (700) o Semi-Bold (600).
    * *Estilo:* Letra clara, espaciado de letras ajustado.
* **Cuerpo de texto (Body):**
    * *Peso:* Regular (400) o Medium (500).
    * *Tamaño base:* 14px - 16px para asegurar la lectura de datos técnicos.

---

## 4. Elementos de Interfaz (UI Components)

### Botones (Buttons)
* **Botón Primario:** * Fondo: Verde Principal (`#4A7A30`).
    * Texto: Blanco.
    * Forma: Totalmente redondeada (Pill-shape, `border-radius: 9999px`) para botones de acción flotantes o muy destacados, o esquinas suavemente redondeadas (`border-radius: 8px`) para botones estándar.
* **Botón Secundario / Filtros:**
    * Fondo: Tono arena/beige claro (`#EAE5D9`) o transparente.
    * Texto: Texto Principal (`#1A1A1A`).
    * Borde: Sin borde o un borde gris muy sutil (`#D1D1D1`).
    * Forma: Esquinas redondeadas (`border-radius: 20px` para etiquetas/tags).

### Tarjetas (Cards)
* **Fondo:** Blanco (`#FFFFFF`).
* **Bordes:** Esquinas redondeadas prominentes (`border-radius: 12px` a `16px`).
* **Sombras (Elevation):** Sombra muy suave y difuminada. 
    * *Ejemplo CSS:* `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);`
* **Espaciado (Padding):** Generoso. Al menos `24px` de padding interno para que el contenido "respire" (como se ve en el panel del Clima o del Desnivel).

### Iconografía
* **Estilo:** Iconos lineales (Outline), trazos limpios de unos `1.5px` a `2px` de grosor.
* **Color:** Gris oscuro para acciones inactivas, Verde o Naranja para iconos destacados o activos.
* **Esquinas:** Ligeramente redondeadas para que coincidan con la estética amigable de la tipografía y los botones.

---

## 5. Espaciado y Layout (Grid)
* **Navegación:** Barra de navegación superior (Navbar) limpia, con fondo del mismo color crema de la página, integrándose de forma fluida.
* **Estructura de Paneles:** Layout de columnas o paneles laterales con mucho espacio en blanco entre módulos.
* **Separadores:** Usar líneas sutiles gris claro (`#EAEAEA`) solo cuando sea estrictamente necesario para dividir secciones, prefiriendo la separación visual mediante el espacio en blanco o el uso de Cards.