// data.js — Contenido académico del Diplomado (UNES)

const UNIDADES = [
  {
    id: 1, codigo: "UC-01", nombre: "Formación Sociocrítica", horas: 20,
    fase: "Fundamentación", icono: "🌱", color: "#10b981",
    descripcion: "Analiza el impacto social de la educación para actuar con integridad y compromiso en la formación ciudadana.",
    competencia: "Pensamiento Crítico y Ética",
    guia: {
      introduccion: "Esta unidad cimenta las bases filosóficas y éticas del docente universitario, analizando el contexto histórico venezolano y latinoamericano, la pedagogía crítica de Freire y Simón Rodríguez, y los dilemas éticos del ejercicio profesional.",
      objetivos: ["Caracterizar las etapas históricas de la educación venezolana","Comparar modelos educativos históricos","Fundamentar la práctica pedagógica en teorías críticas","Aplicar criterios éticos en la resolución de situaciones complejas"],
      secciones: [
        { titulo: "1. Contexto Histórico y Social", contenido: "La educación venezolana ha transitado por hitos fundamentales: desde la colonia, pasando por la independencia y el proyecto robinsoniano de Simón Rodríguez, la escuela positivista de Guzmán Blanco, hasta la Constitución de 1999 que declara la educación como derecho humano. La crisis del modelo tradicional se evidencia en la desvinculación teoría-práctica y la exclusión histórica." },
        { titulo: "2. El Docente como Líder Comunitario", contenido: "El docente de la UNES asume un rol de liderazgo social: no solo transmite conocimiento, sino que transforma su entorno. Su praxis articula la seguridad ciudadana con la formación humanista, promoviendo cultura de paz y prevención del delito." },
        { titulo: "3. Ética Profesional Docente", contenido: "El código de ética se sustenta en responsabilidad, respeto a la dignidad humana, transparencia, justicia, equidad de género, honestidad académica y compromiso social. Los dilemas éticos surgen cuando entran en conflicto intereses personales e institucionales." },
        { titulo: "4. Pedagogía Crítica: Freire y Rodríguez", contenido: "Paulo Freire propone superar la 'educación bancaria' hacia una educación liberadora basada en el diálogo. Simón Rodríguez acuña 'inventamos o erramos', llamado a la soberanía cognitiva latinoamericana." }
      ],
      glosario: { "Educación bancaria": "Modelo donde el docente deposita conocimiento en el estudiante pasivo", "Educación liberadora": "Modelo dialógico donde docente y estudiante construyen el saber", "Descolonización del saber": "Cuestionamiento de paradigmas impuestos" }
    },
    evaluaciones: {
      test: { titulo: "Test de Opción Múltiple", preguntas: [
        { pregunta: "¿Qué modelo educativo critica Paulo Freire?", opciones: ["Constructivista","Educación bancaria","Andragógico","Por competencias"], correcta: 1 },
        { pregunta: "¿Cuál es el aporte central de Simón Rodríguez?", opciones: ["Educación religiosa","Pensamiento emancipador y soberanía cognitiva","Masificación escolar","Evaluación estandarizada"], correcta: 1 },
        { pregunta: "¿Qué caracteriza al docente como líder comunitario?", opciones: ["Transmite solo contenidos","Transforma su entorno","Trabaja aislado","Evita problemas"], correcta: 1 },
        { pregunta: "¿Cuál NO es un principio ético docente?", opciones: ["Transparencia","Justicia","Favoritismo","Respeto"], correcta: 2 },
        { pregunta: "La crisis educativa tradicional se evidencia en:", opciones: ["Exceso de recursos","Desvinculación teoría-práctica","Demasiada tecnología","Falta de estudiantes"], correcta: 1 }
      ]},
      completar: { titulo: "Completar Palabras", ejercicios: [
        { pista: "Modelo que Freire critica: EDUCACION _ _ _ _ _ _ _", respuesta: "educacion bancaria" },
        { pista: "Autor de 'inventamos o erramos': SIMON _ _ _ _ _ _ _ _", respuesta: "simon rodriguez" },
        { pista: "Cuestionar paradigmas impuestos: DESCOLONIZACION DEL _ _ _ _ _", respuesta: "descolonizacion del saber" },
        { pista: "Educación dialógica según Freire: EDUCACION _ _ _ _ _ _ _ _ _ _", respuesta: "educacion liberadora" },
        { pista: "Pilar de la convivencia docente: E _ _ _ _", respuesta: "etica" }
      ]}
    }
  },
  {
    id: 2, codigo: "UC-02", nombre: "Teorías de la Educación, Epistemología y Andragogía", horas: 25,
    fase: "Fundamentación", icono: "🧠", color: "#3b82f6",
    descripcion: "Aplica principios de educación de adultos para facilitar procesos donde el estudiante es protagonista de su saber.",
    competencia: "Gestión del Aprendizaje Autónomo",
    guia: {
      introduccion: "Esta unidad fundamenta epistemológicamente la práctica docente, analiza las principales teorías del aprendizaje y profundiza en la Andragogía como ciencia de la educación de adultos.",
      objetivos: ["Diferenciar tipos de conocimiento","Seleccionar el enfoque pedagógico adecuado","Aplicar principios andragógicos","Estructurar sesiones según el Ciclo de Kolb"],
      secciones: [
        { titulo: "1. Epistemología y Tipos de Saberes", contenido: "La epistemología estudia cómo se construye el conocimiento. Saberes UNES: Conocer, Hacer, Ser, Convivir. El conocimiento científico se distingue del empírico por ser sistemático, verificable, metódico y falible." },
        { titulo: "2. Teorías del Aprendizaje", contenido: "Conductismo (Skinner): cambio de conducta observable. Constructivismo (Piaget, Vygotsky): el estudiante construye activamente el conocimiento. Enfoque por Competencias (Tobón): integra saber, saber hacer y saber ser." },
        { titulo: "3. Andragogía", contenido: "Malcolm Knowles la define como el arte y ciencia de ayudar a aprender a los adultos. Principios: horizontalidad, participación activa, sinergia. El adulto aporta experiencia previa como recurso principal." },
        { titulo: "4. Ciclo de Kolb", contenido: "4 etapas: Experiencia concreta, Observación reflexiva, Conceptualización abstracta, Experimentación activa. El docente debe diseñar sesiones que recorran este ciclo completo." }
      ],
      glosario: { "Andragogía": "Ciencia de la educación de adultos", "Horizontalidad": "Relación sin jerarquías rígidas", "Sinergia": "Aprendizaje de la interacción grupal", "Ciclo de Kolb": "Modelo de aprendizaje en 4 etapas" }
    },
    evaluaciones: {
      test: { titulo: "Test de Opción Múltiple", preguntas: [
        { pregunta: "¿Cuál es el principio central de la Andragogía?", opciones: ["Verticalidad","Horizontalidad y participación","Memorización","Conductismo puro"], correcta: 1 },
        { pregunta: "Las 4 etapas del Ciclo de Kolb son:", opciones: ["Ver-oír-hablar-hacer","Experiencia-reflexión-conceptualización-aplicación","Inicio-medio-fin-eval","Diag-form-suma-final"], correcta: 1 },
        { pregunta: "¿Qué enfoque integra saber, saber hacer y saber ser?", opciones: ["Conductismo","Por Competencias","Instruccionismo","Academicismo"], correcta: 1 },
        { pregunta: "El conocimiento científico es:", opciones: ["Subjetivo","Sistemático y verificable","Intuitivo","Religioso"], correcta: 1 },
        { pregunta: "El conductismo entiende el aprendizaje como:", opciones: ["Construcción social","Cambio de conducta observable","Procesamiento interno","Experiencia subjetiva"], correcta: 1 }
      ]},
      completar: { titulo: "Completar Palabras", ejercicios: [
        { pista: "Ciencia de educación de adultos: A _ _ _ _ _ _ _ _ _", respuesta: "andragogia" },
        { pista: "Autor del Ciclo Experiencial: K _ _ _", respuesta: "kolb" },
        { pista: "Saber UNES de convivencia: SABER _ _ _ _ _ _ _", respuesta: "saber convivir" },
        { pista: "Relación sin jerarquía rígida: H _ _ _ _ _ _ _ _ _ _ _ _ _", respuesta: "horizontalidad" },
        { pista: "El estudiante construye el conocimiento: C _ _ _ _ _ _ _ _ _ _ _ _ _ _", respuesta: "constructivismo" }
      ]}
    }
  },
  {
    id: 3, codigo: "UC-03", nombre: "Psicología Educativa", horas: 20,
    fase: "Fundamentación", icono: "💭", color: "#8b5cf6",
    descripcion: "Comprende los procesos cognitivos y afectivos para crear un clima de aula que favorezca la salud mental y el aprendizaje.",
    competencia: "Inteligencia Emocional y Social",
    guia: {
      introduccion: "Unidad que aborda los procesos psicológicos implicados en el aprendizaje adulto: procesos cognitivos, motivación, neuroplasticidad, inteligencia emocional y dinámica de grupos.",
      objetivos: ["Analizar procesos cognitivos superiores","Fomentar la motivación y autoeficacia","Integrar hallazgos de neurociencia","Gestionar emociones propias y del grupo"],
      secciones: [
        { titulo: "1. Procesos Cognitivos Superiores", contenido: "La percepción, atención y memoria son clave. La memoria de trabajo es limitada, la de largo plazo almacena esquemas. El andamiaje cognitivo ayuda a retener y transferir saberes." },
        { titulo: "2. Motivación y Autoeficacia", contenido: "Motivación intrínseca (deseo interno) vs extrínseca (recompensa externa). Bandura plantea la autoeficacia como la creencia en la propia capacidad." },
        { titulo: "3. Neuroeducación", contenido: "La neuroplasticidad permite que el cerebro adulto siga aprendiendo. El sistema límbico (emociones) y la corteza prefrontal (razonamiento) deben integrarse." },
        { titulo: "4. Inteligencia Emocional", contenido: "Componentes de Goleman: autoconciencia, autorregulación, motivación, empatía y habilidades sociales." },
        { titulo: "5. Dinámica de Grupos", contenido: "Roles típicos, liderazgo, resolución de conflictos. La convivencia se construye con acuerdos participativos y peer-mentoring." }
      ],
      glosario: { "Neuroplasticidad": "Capacidad del cerebro de reorganizarse", "Autoeficacia": "Creencia en la propia capacidad", "Inteligencia Emocional": "Reconocer y gestionar emociones", "Peer-mentoring": "Acompañamiento entre pares" }
    },
    evaluaciones: {
      test: { titulo: "Test de Opción Múltiple", preguntas: [
        { pregunta: "¿Qué autor propone la Inteligencia Emocional?", opciones: ["Piaget","Goleman","Skinner","Freire"], correcta: 1 },
        { pregunta: "¿Qué es la neuroplasticidad?", opciones: ["Rigidez cerebral","Capacidad de reorganizarse","Enfermedad","Tipo de memoria"], correcta: 1 },
        { pregunta: "La motivación intrínseca es:", opciones: ["Recompensa externa","Deseo interno de aprender","Obligación","Castigo"], correcta: 1 },
        { pregunta: "¿Qué sistema cerebral se relaciona con emociones?", opciones: ["Límbico","Digestivo","Óseo","Endocrino"], correcta: 0 },
        { pregunta: "El peer-mentoring es:", opciones: ["Evaluación sumativa","Acompañamiento entre pares","Castigo","Prueba escrita"], correcta: 1 }
      ]},
      completar: { titulo: "Completar Palabras", ejercicios: [
        { pista: "Capacidad del cerebro de reorganizarse: N _ _ _ _ _ _ _ _ _ _ _ _ _ _ _", respuesta: "neuroplasticidad" },
        { pista: "Autor de 'Inteligencia Emocional': G _ _ _ _ _ _", respuesta: "goleman" },
        { pista: "Creencia en la propia capacidad: A _ _ _ _ _ _ _ _ _ _", respuesta: "autoeficacia" },
        { pista: "Acompañamiento entre pares: PEER _ _ _ _ _ _ _ _", respuesta: "peer mentoring" },
        { pista: "Memoria de corto plazo activa: MEMORIA DE _ _ _ _ _ _ _", respuesta: "memoria de trabajo" }
      ]}
    }
  },
  {
    id: 4, codigo: "UC-04", nombre: "Tecnologías de la Información y la Comunicación", horas: 20,
    fase: "Herramientas", icono: "💻", color: "#06b6d4",
    descripcion: "Utiliza herramientas tecnológicas y entornos virtuales para dinamizar la gestión de contenidos y la comunicación pedagógica.",
    competencia: "Alfabetización Digital",
    guia: {
      introduccion: "Unidad enfocada en el dominio técnico de herramientas digitales para la docencia: ofimática, búsqueda académica, LMS, comunicación digital y creación de contenidos multimedia.",
      objetivos: ["Emplear herramientas ofimáticas","Filtrar información digital de calidad","Gestionar aulas virtuales (Moodle, Classroom)","Diseñar recursos multimedia educativos"],
      secciones: [
        { titulo: "1. Alfabetización Digital", contenido: "Competencia para usar TIC de forma crítica. Procesadores de texto, hojas de cálculo y presentaciones para gestión docente." },
        { titulo: "2. Gestión de la Información", contenido: "Búsqueda en Google Académico, Scopus, Scielo. Operadores booleanos (AND, OR, NOT). Validación de fuentes: autoría, actualidad, respaldo institucional." },
        { titulo: "3. Entornos Virtuales de Aprendizaje (EVA)", contenido: "LMS = Learning Management System. Moodle y Google Classroom permiten subir recursos, configurar tareas, foros y seguimiento." },
        { titulo: "4. Comunicación Síncrona y Asíncrona", contenido: "Síncrona: videollamadas, chat en vivo. Asíncrona: correo, foros. La netiqueta regula el comportamiento digital profesional." },
        { titulo: "5. Creación de Contenidos Digitales", contenido: "Infografías (Canva, Genially), videos educativos (CapCut), podcasts. Uso de licencias Creative Commons." }
      ],
      glosario: { "LMS": "Learning Management System", "EVA": "Entorno Virtual de Aprendizaje", "Netiqueta": "Normas de comportamiento digital", "Creative Commons": "Licencias de uso libre" }
    },
    evaluaciones: {
      test: { titulo: "Test de Opción Múltiple", preguntas: [
        { pregunta: "¿Qué significa LMS?", opciones: ["Learning Management System","Long Method System","Local Media Server","Logical Memory"], correcta: 0 },
        { pregunta: "¿Qué es la netiqueta?", opciones: ["Software de red","Normas de comportamiento digital","Protocolo de internet","Virus"], correcta: 1 },
        { pregunta: "¿Cuál es un repositorio académico confiable?", opciones: ["Wikipedia","Scielo","Foro anónimo","Blog personal"], correcta: 1 },
        { pregunta: "Una videollamada es comunicación:", opciones: ["Asíncrona","Síncrona","Pasiva","Unidireccional"], correcta: 1 },
        { pregunta: "Creative Commons permite:", opciones: ["Solo uso comercial","Uso libre con condiciones","Prohibir todo","Vender contenido"], correcta: 1 }
      ]},
      completar: { titulo: "Completar Palabras", ejercicios: [
        { pista: "Sistema de gestión de aprendizaje: L _ _", respuesta: "lms" },
        { pista: "Entorno Virtual de Aprendizaje: E _ _", respuesta: "eva" },
        { pista: "Plataforma LMS libre: M _ _ _ _ _", respuesta: "moodle" },
        { pista: "Normas de comportamiento en internet: N _ _ _ _ _ _ _ _", respuesta: "netiqueta" },
        { pista: "Comunicación en vivo (no diferida): S _ _ _ _ _ _ _", respuesta: "sincrona" }
      ]}
    }
  },
  {
    id: 5, codigo: "UC-05", nombre: "Estrategias de Enseñanza – Aprendizaje", horas: 25,
    fase: "Herramientas", icono: "🎯", color: "#f59e0b",
    descripcion: "Diseña experiencias de aprendizaje dinámicas que permiten al estudiante abordar retos reales mediante el trabajo colaborativo.",
    competencia: "Resolución de Problemas",
    guia: {
      introduccion: "Unidad que dota al docente de un repertorio de estrategias activas: ABP, aprendizaje cooperativo, estudio de casos, simulación y diseño de secuencias didácticas efectivas.",
      objetivos: ["Seleccionar técnicas de enseñanza dialógicas","Implementar el ABP","Aplicar estrategias de organización","Diseñar secuencias didácticas completas"],
      secciones: [
        { titulo: "1. Métodos Activos", contenido: "Clase magistral dialogada, debate dirigido, seminario. El docente pregunta, no solo expone. Preguntas mediadoras generan reflexión." },
        { titulo: "2. Aprendizaje Basado en Problemas (ABP)", contenido: "El estudiante parte de un problema real y busca soluciones. Desarrolla pensamiento crítico. El docente guía, no resuelve." },
        { titulo: "3. Estrategias de Aprendizaje", contenido: "Mapas mentales, conceptuales, cuadros sinópticos. Trabajo colaborativo. Metacognición: reflexionar sobre el propio aprendizaje." },
        { titulo: "4. Simulación y Estudio de Casos", contenido: "Estudio de casos reales o simulados. Juego de roles (dramatización). El debriefing cierra el aprendizaje." },
        { titulo: "5. Diseño de la Secuencia Didáctica", contenido: "Momentos: Inicio (activar saberes), Desarrollo (construcción), Cierre (síntesis y metacognición)." }
      ],
      glosario: { "ABP": "Aprendizaje Basado en Problemas", "Debriefing": "Reflexión posterior a simulación", "Metacognición": "Conciencia del propio aprendizaje", "Secuencia didáctica": "Organización de momentos de clase" }
    },
    evaluaciones: {
      test: { titulo: "Test de Opción Múltiple", preguntas: [
        { pregunta: "¿Qué significa ABP?", opciones: ["Aprendizaje Básico Programado","Aprendizaje Basado en Problemas","Análisis Bibliográfico","Aula Bimodal"], correcta: 1 },
        { pregunta: "¿Qué es el debriefing?", opciones: ["Examen final","Reflexión post-simulación","Tarea para casa","Lectura obligatoria"], correcta: 1 },
        { pregunta: "Los 3 momentos de la secuencia didáctica son:", opciones: ["Inicio-desarrollo-cierre","Lunes-miércoles-viernes","Teoría-práctica-examen","Diag-form-suma"], correcta: 0 },
        { pregunta: "¿Qué estrategia usa mapas conceptuales?", opciones: ["Expositiva pura","Procesamiento de información","Memorística","Conductista"], correcta: 1 },
        { pregunta: "La metacognición es:", opciones: ["Memorizar datos","Reflexionar sobre el propio aprendizaje","Copia literal","Evaluación sumativa"], correcta: 1 }
      ]},
      completar: { titulo: "Completar Palabras", ejercicios: [
        { pista: "Aprendizaje Basado en Problemas: A _ _", respuesta: "abp" },
        { pista: "Reflexión posterior a simulación: D _ _ _ _ _ _ _ _ _", respuesta: "debriefing" },
        { pista: "Conciencia del propio aprendizaje: M _ _ _ _ _ _ _ _ _ _ _", respuesta: "metacognicion" },
        { pista: "Primer momento de la clase: I _ _ _ _ _", respuesta: "inicio" },
        { pista: "Clase donde el docente pregunta y guía: CLASE _ _ _ _ _ _ _ _ _ DIALOGADA", respuesta: "clase magistral dialogada" }
      ]}
    }
  },
  {
    id: 6, codigo: "UC-06", nombre: "Planificación y Estrategias de Instrucción", horas: 25,
    fase: "Aplicación Praxis", icono: "📋", color: "#ef4444",
    descripcion: "Estructura de forma lógica y coherente las metas de enseñanza, optimizando el tiempo y los recursos disponibles.",
    competencia: "Organización y Visión Sistémica",
    guia: {
      introduccion: "Unidad que enseña a planificar la enseñanza con rigor técnico: diagnóstico, objetivos, contenidos, estrategias, recursos y evaluación, alineados al Sistema Educativo Bolivariano.",
      objetivos: ["Ejecutar fases técnicas de planificación","Diferenciar niveles de planificación","Elaborar planes operativos y didácticos","Aplicar el modelo V Heurística"],
      secciones: [
        { titulo: "1. Proceso de Planificación", contenido: "Etapas: diagnóstico, pronóstico, análisis de alternativas, formulación de objetivos y metas. Todo plan parte de la realidad concreta." },
        { titulo: "2. Gestión y Control", contenido: "Programación, ejecución, control y evaluación del plan. El cronograma es la herramienta de control temporal." },
        { titulo: "3. Tipologías de Planificación", contenido: "Estratégica (largo plazo), operativa (mediano), curricular (malla), de enseñanza (clase a clase)." },
        { titulo: "4. Formatos de Planificación", contenido: "Plan clase a clase, unidad didáctica, anual, sabana, en T, V Heurística y trayecto." },
        { titulo: "5. Planificación en el SEB", contenido: "Características: flexibilidad, visión sistémica e intencionalidad. Se adapta al Sistema Educativo Bolivariano." }
      ],
      glosario: { "Diagnóstico": "Análisis de la realidad antes de planificar", "V Heurística": "Formato gráfico de organización del conocimiento", "Intencionalidad": "Propósito pedagógico explícito" }
    },
    evaluaciones: {
      test: { titulo: "Test de Opción Múltiple", preguntas: [
        { pregunta: "La primera etapa de la planificación es:", opciones: ["Ejecución","Diagnóstico","Evaluación","Cierre"], correcta: 1 },
        { pregunta: "La planificación estratégica es de:", opciones: ["Corto plazo","Largo plazo","Una clase","Un día"], correcta: 1 },
        { pregunta: "¿Qué es la V Heurística?", opciones: ["Un examen","Formato gráfico de organización","Un tipo de aula","Un software"], correcta: 1 },
        { pregunta: "El cronograma sirve para:", opciones: ["Decorar","Controlar tiempos","Evaluar","Nada"], correcta: 1 },
        { pregunta: "La planificación en el SEB se caracteriza por:", opciones: ["Rigidez","Flexibilidad, visión sistémica e intencionalidad","Improvisación","Ausencia de objetivos"], correcta: 1 }
      ]},
      completar: { titulo: "Completar Palabras", ejercicios: [
        { pista: "Primera etapa de la planificación: D _ _ _ _ _ _ _ _ _ _ _", respuesta: "diagnostico" },
        { pista: "Herramienta para controlar tiempos: C _ _ _ _ _ _ _ _ _", respuesta: "cronograma" },
        { pista: "Formato gráfico de organización: V _ _ _ _ _ _ _ _ _", respuesta: "v heuristica" },
        { pista: "Tipo de planificación a largo plazo: E _ _ _ _ _ _ _ _ _", respuesta: "estrategica" },
        { pista: "Característica de la planificación SEB: F _ _ _ _ _ _ _ _ _ _", respuesta: "flexibilidad" }
      ]}
    }
  },
  {
    id: 7, codigo: "UC-07", nombre: "Didáctica", horas: 20,
    fase: "Aplicación Praxis", icono: "🎤", color: "#ec4899",
    descripcion: "Domina el discurso y la expresión corporal para mediar el conocimiento de manera clara, motivadora y profesional.",
    competencia: "Comunicación Asertiva",
    guia: {
      introduccion: "Unidad centrada en la didáctica como proceso comunicativo, el uso estratégico de recursos tradicionales y tecnológicos, y la arquitectura del aprendizaje según estilos y canales de percepción.",
      objetivos: ["Fundamentar la práctica en principios didácticos","Seleccionar recursos didácticos adecuados","Integrar TIC críticamente","Atender la diversidad sensorial del grupo"],
      secciones: [
        { titulo: "1. Didáctica", contenido: "El acto didáctico es un fenómeno comunicativo. Se articula con la pedagogía y la psicología en entornos constructivistas. La voz es una herramienta fundamental." },
        { titulo: "2. Recursos de Mediación", contenido: "Herramientas convencionales: voz, pizarras, maquetas, mapas, gráficos y materiales impresos. Clasificación, ventajas y uso técnico." },
        { titulo: "3. Tecnología Educativa", contenido: "Medios tecnológicos: computadoras, Internet, recursos multimedia, plataformas y sistemas de apoyo a distancia." },
        { titulo: "4. Arquitectura del Aprendizaje", contenido: "Canales visual, auditivo y kinestésico. Interacción con el entorno (dependencia e independencia). Diseño de experiencias inclusivas." }
      ],
      glosario: { "Acto didáctico": "Proceso de comunicación pedagógica", "Transposición didáctica": "Adaptar el saber sabio al saber enseñable", "Canal kinestésico": "Aprendizaje mediante movimiento y tacto" }
    },
    evaluaciones: {
      test: { titulo: "Test de Opción Múltiple", preguntas: [
        { pregunta: "El acto didáctico es fundamentalmente:", opciones: ["Un monólogo","Un fenómeno comunicativo","Una evaluación","Una tarea"], correcta: 1 },
        { pregunta: "Los canales de percepción son:", opciones: ["Visual, auditivo, kinestésico","Alto, medio, bajo","Teórico, práctico, mixto","A, B, C"], correcta: 0 },
        { pregunta: "La voz del docente es:", opciones: ["Irrelevante","Herramienta fundamental","Solo para cantar","Decorativa"], correcta: 1 },
        { pregunta: "Un recurso convencional es:", opciones: ["Moodle","Pizarra","ChatGPT","Zoom"], correcta: 1 },
        { pregunta: "La transposición didáctica es:", opciones: ["Copiar el libro","Adaptar el saber al aula","Ignorar contenidos","Improvisar"], correcta: 1 }
      ]},
      completar: { titulo: "Completar Palabras", ejercicios: [
        { pista: "El acto didáctico es un proceso: C _ _ _ _ _ _ _ _ _ _ _ _", respuesta: "comunicativo" },
        { pista: "Canal de aprendizaje por movimiento: K _ _ _ _ _ _ _ _ _ _ _", respuesta: "kinestesico" },
        { pista: "Adaptar el saber al aula: T _ _ _ _ _ _ _ _ _ _ _ _ _ DIDACTICA", respuesta: "transposicion didactica" },
        { pista: "Canal de aprendizaje por la vista: V _ _ _ _ _", respuesta: "visual" },
        { pista: "Canal de aprendizaje por el oído: A _ _ _ _ _ _ _", respuesta: "auditivo" }
      ]}
    }
  },
  {
    id: 8, codigo: "UC-08", nombre: "Evaluación de los Aprendizajes", horas: 25,
    fase: "Aplicación Praxis", icono: "📊", color: "#14b8a6",
    descripcion: "Implementa sistemas de valoración justos y transparentes que permiten la mejora continua del proceso educativo.",
    competencia: "Cultura de la Calidad",
    guia: {
      introduccion: "Unidad que forma al docente en el diseño e implementación de sistemas de evaluación integrales: diagnóstica, formativa y sumativa, con instrumentos como rúbricas y portafolios.",
      objetivos: ["Diferenciar tipos de evaluación","Aplicar autoevaluación, coevaluación y heteroevaluación","Diseñar rúbricas y listas de cotejo","Analizar resultados para la mejora"],
      secciones: [
        { titulo: "1. Fundamentos de la Evaluación", contenido: "Definición, funciones y principios. Tipología: Diagnóstica (inicio), Formativa (durante), Sumativa (final)." },
        { titulo: "2. Formas de Participación", contenido: "Autoevaluación (uno mismo), Coevaluación (entre pares), Heteroevaluación (docente). La ética en la evaluación es clave." },
        { titulo: "3. Técnicas e Instrumentos", contenido: "Pruebas escritas, escalas de estimación, listas de cotejo, rúbricas y portafolios de evidencias." },
        { titulo: "4. Sistematización y Resultados", contenido: "Análisis de resultados, toma de decisiones y la retroalimentación (feedback) como estrategia pedagógica." }
      ],
      glosario: { "Rúbrica": "Instrumento con criterios y niveles de desempeño", "Portafolio": "Colección de evidencias de aprendizaje", "Feedback": "Retroalimentación del proceso", "Heteroevaluación": "Evaluación del docente al estudiante" }
    },
    evaluaciones: {
      test: { titulo: "Test de Opción Múltiple", preguntas: [
        { pregunta: "La evaluación que se hace al inicio es:", opciones: ["Sumativa","Diagnóstica","Formativa","Final"], correcta: 1 },
        { pregunta: "La coevaluación es la que se hace:", opciones: ["Uno mismo","Entre pares","Solo el docente","El directivo"], correcta: 1 },
        { pregunta: "Una rúbrica es:", opciones: ["Un tipo de examen","Instrumento con criterios y niveles","Un libro","Una tarea"], correcta: 1 },
        { pregunta: "La evaluación formativa sirve para:", opciones: ["Solo calificar","Mejorar durante el proceso","Castigar","Nada"], correcta: 1 },
        { pregunta: "El feedback es:", opciones: ["Un castigo","Retroalimentación","Una prueba","Un examen"], correcta: 1 }
      ]},
      completar: { titulo: "Completar Palabras", ejercicios: [
        { pista: "Evaluación al inicio del proceso: D _ _ _ _ _ _ _ _ _ _ _", respuesta: "diagnostica" },
        { pista: "Evaluación entre pares: C _ _ _ _ _ _ _ _ _ _ _", respuesta: "coevaluacion" },
        { pista: "Evaluación del docente al estudiante: H _ _ _ _ _ _ _ _ _ _ _ _ _ _", respuesta: "heteroevaluacion" },
        { pista: "Instrumento con criterios y niveles: R _ _ _ _ _ _", respuesta: "rubrica" },
        { pista: "Retroalimentación del proceso: F _ _ _ _ _ _ _", respuesta: "feedback" }
      ]}
    }
  },
  {
    id: 9, codigo: "UC-09", nombre: "Inteligencia Artificial para Docentes", horas: 20,
    fase: "Herramientas", icono: "🤖", color: "#a855f7",
    descripcion: "Integra la Inteligencia Artificial de forma ética para potenciar la creatividad y la eficiencia en la labor docente.",
    competencia: "Innovación y Adaptabilidad",
    guia: {
      introduccion: "Unidad pionera que empodera al docente en el uso estratégico y ético de la IA Generativa como asistente pedagógico: prompts, investigación, diseño de materiales y consideraciones éticas.",
      objetivos: ["Caracterizar las funciones de la IA","Diseñar prompts efectivos","Usar IA en investigación y evaluación","Aplicar principios éticos"],
      secciones: [
        { titulo: "1. Fundamentos de la IA en Educación", contenido: "IA Generativa y Modelos de Lenguaje (LLM). Su impacto en el rol del docente universitario. Alcances y limitaciones." },
        { titulo: "2. Ingeniería de Prompts", contenido: "Estructura de un prompt efectivo: contexto, tarea, formato. Creación de materiales didácticos y recursos visuales." },
        { titulo: "3. IA en la Investigación y Evaluación", contenido: "Búsqueda semántica, análisis de datos, revisión bibliográfica y diseño de instrumentos de evaluación asistidos por IA." },
        { titulo: "4. Ética y Transparencia", contenido: "Sesgos algorítmicos, alucinaciones de la IA, plagio académico y normas UNESCO/COPE sobre el uso de IA." }
      ],
      glosario: { "IA Generativa": "IA que crea contenido nuevo", "LLM": "Large Language Model (modelo de lenguaje grande)", "Prompt": "Instrucción que se da a la IA", "Alucinación": "Respuesta incorrecta o inventada por la IA" }
    },
    evaluaciones: {
      test: { titulo: "Test de Opción Múltiple", preguntas: [
        { pregunta: "¿Qué significa LLM?", opciones: ["Long Learning Method","Large Language Model","Local Logic Machine","Logical List Model"], correcta: 1 },
        { pregunta: "Un prompt efectivo debe incluir:", opciones: ["Solo una palabra","Contexto, tarea y formato","Solo el formato","Nada"], correcta: 1 },
        { pregunta: "Las 'alucinaciones' de la IA son:", opciones: ["Imágenes","Respuestas incorrectas o inventadas","Errores eléctricos","Tipos de prompt"], correcta: 1 },
        { pregunta: "El uso ético de la IA implica:", opciones: ["Copiar todo","Transparencia y declaración","Ocultar el uso","Ignorar fuentes"], correcta: 1 },
        { pregunta: "La UNESCO publicó guías sobre IA en:", opciones: ["Deportes","Educación e investigación","Cocina","Música"], correcta: 1 }
      ]},
      completar: { titulo: "Completar Palabras", ejercicios: [
        { pista: "Modelo de lenguaje grande: L _ _", respuesta: "llm" },
        { pista: "Instrucción que se da a la IA: P _ _ _ _ _", respuesta: "prompt" },
        { pista: "Respuesta incorrecta inventada por IA: A _ _ _ _ _ _ _ _ _ _", respuesta: "alucinacion" },
        { pista: "IA que crea contenido nuevo: I _   G _ _ _ _ _ _ _ _ _", respuesta: "ia generativa" },
        { pista: "Organización que publicó guías de IA educativa: U _ _ _ _ _", respuesta: "unesco" }
      ]}
    }
  }
];