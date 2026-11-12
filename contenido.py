"""Contenido editorial y datos del corte del 12 de noviembre de 2026."""

CLUB = "https://www.valenciacf.com"
LIGA = "https://www.laliga.com"
TABLA = LIGA + "/laliga-easports/clasificacion"
CALENDARIO = LIGA + "/clubes/valencia-cf/proximos-partidos"
ESTADISTICAS = LIGA + "/clubes/valencia-cf/estadisticas"
FICHAJES = LIGA + "/clubes/valencia-cf/fichajes"

ARTICULOS = [
    dict(slug="valencia-tavernes-copa-del-rey", cat="Actualidad", tag="COPA DEL REY",
         title="El Valencia golea en Copa y pone rumbo a Vallecas", date="2026-11-12", img="mestalla",
         alt="Ilustración de un estadio de fútbol iluminado, con la grada en naranja",
         intro="El 0–6 ante la UE Tavernes deja un doblete de Aimar Blázquez y una victoria antes del regreso a LaLiga.",
         paragraphs=[
             "El Valencia CF resolvió su eliminatoria de Copa del Rey el martes 10 de noviembre con un 0–6 ante la UE Tavernes de la Valldigna. El partido se jugó en Mestalla, con el Tavernes como local a efectos de la eliminatoria.",
             "Aimar Blázquez marcó dos tantos. Raba, Hugo Duro, Luis Rioja y Harvey Elliott completaron el marcador, que dio al Valencia el pase a la siguiente ronda.",
             "El siguiente compromiso liguero será en el Estadio de Vallecas el sábado 21 de noviembre a las 16:15. El Valencia llega a la jornada 13 con nueve puntos, pendiente de sumar fuera de casa."],
         source=CLUB + "/cronica-el-valencia-cf-avanza-a-la-segunda-eliminatoria-de-la-copa-del-rey-tras-vencer-a-la-ue-tavernes-0-6",
         source_name="Crónica oficial del Valencia CF"),
    dict(slug="internacionales-valencia-noviembre", cat="Actualidad", tag="PRIMER EQUIPO",
         title="Cuatro valencianistas, convocados con sus selecciones", date="2026-11-11", img="grada",
         alt="Ilustración de una grada con aficionados y banderas naranjas",
         intro="Dimitrievski, Dieng, Diakhaby y Sato tienen compromisos internacionales durante el parón.",
         paragraphs=[
             "El Valencia CF confirmó cuatro convocatorias internacionales para noviembre. Stole Dimitrievski se incorpora a Macedonia del Norte, Aliou Dieng a Mali, Mouctar Diakhaby a Guinea y Ryunosuke Sato a Japón sub-21.",
             "En el calendario del club figura el amistoso sub-21 entre España y Japón del 13 de noviembre. Las otras citas se reparten entre la UEFA Nations League y la clasificación para la Copa de África."],
         source=CLUB + "/conoce-la-agenda-de-nuestros-internacionales-para-noviembre-de-2026",
         source_name="Agenda oficial del Valencia CF"),
    dict(slug="plan-trabajo-valencia-paterna", cat="Entrenamientos", tag="ENTRENAMIENTOS",
         title="El plan de trabajo tras la Copa del Rey", date="2026-11-10", img="paterna",
         alt="Ilustración de futbolistas en una sesión de entrenamiento",
         intro="El club publicó el parte de trabajo del 11 de noviembre tras la eliminatoria de Copa.",
         paragraphs=[
             "El Valencia CF publicó su plan de trabajo para el miércoles 11 de noviembre, al día siguiente de la victoria en Copa. El parte del club es la referencia para consultar la convocatoria de una sesión y sus condiciones de acceso.",
             "El siguiente partido de Liga está programado para el sábado 21 de noviembre en Vallecas. Puedes consultar la hora confirmada y descargar la cita desde el calendario de SEMPRE AMUNT."],
         source=CLUB + "/plan-de-trabajo", source_name="Plan de trabajo del Valencia CF"),
    dict(slug="harvey-elliott-cesion-valencia", cat="Fichajes", tag="FICHAJES",
         title="Harvey Elliott, cedido por el Liverpool", date="2026-09-01", img="jugador",
         alt="Ilustración de un futbolista anónimo mirando al campo desde el túnel",
         intro="El mediapunta inglés se incorporó al Valencia CF en préstamo para la temporada 2026/27.",
         paragraphs=[
             "El Valencia CF anunció el 1 de septiembre el acuerdo con el Liverpool para incorporar a Harvey Elliott en calidad de cedido hasta final de temporada.",
             "Elliott se formó en el Fulham y debutó en la Premier League con 16 años. Su trayectoria incluye etapas en Blackburn Rovers y Aston Villa, además de su paso por el primer equipo del Liverpool."],
         source=CLUB + "/comunicado-oficial-harvey-elliott", source_name="Comunicado oficial del Valencia CF"),
    dict(slug="arnau-martinez-fichaje-valencia", cat="Fichajes", tag="FICHAJES",
         title="Arnau Martínez firma hasta 2031", date="2026-08-26", img="jugador",
         alt="Ilustración de un futbolista anónimo en un túnel de estadio",
         intro="El lateral se incorporó desde el Girona FC con un contrato de cinco temporadas.",
         paragraphs=[
             "El Valencia CF comunicó el 26 de agosto el acuerdo de traspaso con el Girona FC. Arnau Martínez firmó por cinco temporadas, hasta 2031.",
             "El lateral disputó 200 encuentros oficiales con el Girona según el comunicado del club, repartidos entre competiciones de Liga, Copa y Champions League."],
         source=CLUB + "/comunicado-oficial-arnau-martinez", source_name="Comunicado oficial del Valencia CF"),
]

PARTIDOS = [
    ("2026-11-21", "SÁB", "NOV", "16:15", 13, "Rayo Vallecano", "Valencia CF", "Estadio de Vallecas", "DAZN", "fuera", "rayo-vallecano-valencia-cf-13"),
    ("2026-11-29", "DOM", "NOV", "14:00", 14, "Valencia CF", "CA Osasuna", "Mestalla", "DAZN LaLiga", "casa", "valencia-cf-ca-osasuna-14"),
    ("2026-12-06", "DOM", "DIC", "", 15, "Getafe CF", "Valencia CF", "", "", "fuera", "getafe-cf-valencia-cf-15"),
    ("2026-12-13", "DOM", "DIC", "", 16, "Atlético de Madrid", "Valencia CF", "", "", "fuera", "atletico-de-madrid-valencia-cf-16"),
]

# Equipo, puntos, partidos, victorias, empates, derrotas, goles a favor y en contra.
CLASIFICACION = [
    ("FC Barcelona",33,12,11,0,1,48,13), ("Real Madrid",30,12,10,0,2,31,10),
    ("Atlético de Madrid",28,12,9,1,2,23,10), ("Real Betis",26,12,8,2,2,20,15),
    ("Real Sociedad",22,12,7,1,4,21,20), ("Sevilla FC",18,12,5,3,4,17,19),
    ("Athletic Club",16,11,4,4,3,15,11), ("Villarreal CF",15,12,4,3,5,17,15),
    ("RC Deportivo",15,12,3,6,3,15,14), ("R. Racing Club",14,12,4,2,6,17,30),
    ("Celta",13,12,2,7,3,10,10), ("Deportivo Alavés",13,12,3,4,5,15,17),
    ("RCD Espanyol",12,12,3,3,6,13,14), ("Rayo Vallecano",12,11,3,3,5,15,21),
    ("Getafe CF",12,12,3,3,6,8,18), ("CA Osasuna",12,12,3,3,6,12,23),
    ("Levante UD",11,12,2,5,5,16,21), ("Elche CF",10,12,2,4,6,14,20),
    ("Valencia CF",9,12,2,3,7,8,20), ("Málaga CF",5,12,0,5,7,9,23),
]

# Dorsal, nombre, posición, minutos, partidos, titularidades y goles.
JUGADORES = [
    (1,"Stole Dimitrievski","Portero",1080,12,12,0), (2,"Guido Rodríguez","Centrocampista",736,9,9,0),
    (3,"José Copete","Defensa",0,0,0,0), (4,"Mouctar Diakhaby","Defensa",334,6,4,0),
    (5,"César Tárrega","Defensa",690,9,8,0), (6,"Umar Sadiq","Delantero",246,5,2,2),
    (7,"Arnaut Danjuma","Delantero",929,12,10,0), (8,"Javi Guerra","Centrocampista",980,12,12,0),
    (9,"Hugo Duro","Delantero",415,10,5,0), (10,"Harvey Elliott","Centrocampista",152,6,0,0),
    (11,"Luis Rioja","Delantero",365,8,3,1), (12,"Justin de Haas","Defensa",503,7,7,0),
    (13,"Cristian Rivero","Portero",0,0,0,0), (14,"José Luis Gayà","Defensa",794,10,9,0),
    (15,"Aliou Dieng","Centrocampista",232,6,2,0), (18,"Pepelu","Centrocampista",1018,12,12,1),
    (19,"Dani Raba","Delantero",188,5,2,1), (20,"Dimitri Foulquier","Defensa",0,0,0,0),
    (21,"Jesús Vázquez","Defensa",362,10,4,0), (22,"Arnau Martínez","Defensa",383,8,4,0),
    (23,"Filip Ugrinic","Centrocampista",623,12,7,0), (24,"Pablo Maffeo","Defensa",707,11,9,0),
    (25,"Van Oevelen","Portero",0,0,0,0), (27,"David Otorbi","Delantero",345,9,3,1),
    (29,"Panach","Defensa",0,0,0,0), (31,"Gamón","Defensa",0,0,0,0),
    (33,"Mayol","Centrocampista",348,4,4,1), (36,"I. Córdoba","Defensa",102,3,0,0),
    (37,"Aimar Blázquez","Delantero",39,2,0,0), (38,"Jaume Durà","Centrocampista",0,0,0,0),
    (39,"Ryunosuke Sato","Centrocampista",297,5,4,0), (41,"M. Navarro","Defensa",0,0,0,0),
]
