# Criptografia Web

Aplicacion web para experimentar con cifrados clasicos y realizar un analisis basico de criptogramas. El proyecto permite normalizar textos usando el alfabeto espanol de 27 caracteres (`A-Z` y `Ñ`), cifrar mensajes y probar tecnicas de desencriptacion desde el navegador.

## Funcionalidades

### Encriptacion

- Normalizacion automatica: convierte el texto a mayusculas y elimina espacios, tildes y puntuacion.
- Cifrado Cesar con desplazamientos de `0` a `26`.
- Cifrado Afin con las claves `a` y `b`, validando que `a` sea coprimo con `27`.
- Cifrado Vigenere mediante una palabra clave normalizada y repetida sobre el mensaje.
- Visualizacion del texto normalizado y del resultado cifrado.

### Desencriptacion y criptoanalisis

- Calculo del indice de coincidencia (IC) del criptograma normalizado.
- Tabla y grafica de frecuencias locales de las letras.
- Identificacion orientativa de cifrado Cesar, Afin o Vigenere.
- Fuerza bruta para comparar los 27 desplazamientos de Cesar.
- Busqueda de la mejor pareja de claves `a` y `b` para el cifrado Afin.
- Estimacion de la longitud y recuperacion de la clave Vigenere mediante analisis Kasiski y frecuencias por columnas.
- La mejor clave Afin detectada por el diagnostico se carga automaticamente en la tarjeta de desencriptacion y permanece editable.

> El analisis es heuristico y esta pensado con fines didacticos. La calidad de los resultados depende de la longitud y del contenido del criptograma.

## Tecnologias

- [Next.js](https://nextjs.org/) 16 con App Router y React 19.
- TypeScript.
- Tailwind CSS 4 para los estilos.
- [shadcn/ui](https://ui.shadcn.com/) para la base de componentes y el sistema visual.
- [Lucide React](https://lucide.dev/) para los iconos de navegacion.
- [Recharts](https://recharts.org/) para la grafica de frecuencias.
- ESLint para la comprobacion de calidad del codigo.

La interfaz utiliza componentes reutilizables ubicados en `components/ui`, variables CSS y el sistema de alias de shadcn configurado en `components.json`.

## Estructura del proyecto

```text
Criptografia-web/
├── README.md
└── criptografia-web/
	├── app/
	│   ├── page.tsx                 # Desencriptacion y criptoanalisis
	│   ├── encriptacion/page.tsx    # Cifrado de mensajes
	│   ├── globals.css               # Estilos globales y variables CSS
	│   └── layout.tsx                # Layout, sidebar y metadatos
	├── components/
	│   ├── app-sidebar.tsx          # Navegacion entre las vistas
	│   ├── search-form.tsx
	│   ├── version-switcher.tsx
	│   └── ui/                      # Componentes basados en shadcn/ui
	├── hooks/
	│   └── use-mobile.ts             # Deteccion de viewport movil
	├── lib/
	│   └── utils.ts                  # Utilidades compartidas
	├── public/                       # Recursos publicos
	├── components.json               # Configuracion de shadcn/ui
	├── package.json
	└── tsconfig.json
```

## Requisitos

- Node.js 20 o superior.
- npm.

## Instalacion y ejecucion

Desde la raiz del repositorio:

```bash
cd criptografia-web
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

## Scripts disponibles

Ejecuta estos comandos dentro de `criptografia-web/`:

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Genera la compilacion de produccion
npm run start    # Sirve la compilacion de produccion
npm run lint     # Ejecuta ESLint
```

## Modelo del alfabeto

El proyecto utiliza este orden para convertir letras en posiciones numericas:

```text
A B C D E F G H I J K L M N Ñ O P Q R S T U V W X Y Z
```

Por tanto, las operaciones se realizan modulo `27`. En el cifrado Afin, la formula es:

```text
C = (a × m + b) mod 27
```

Para descifrar, `a` debe tener inverso modular, por eso solo se aceptan valores coprimos con `27`.