# Símbolo y edición de biestables genéricos

D, T, JK y RS conservan un cuerpo de 2 × 3 unidades al seleccionar ninguna
entrada asíncrona, SET/RESET o PR/CLR. Las entradas superior e inferior no
añaden anchura al encapsulado ni desplazan los terminales principales.

En D, T y JK se muestran únicamente los selectores de funcionamiento y de
entradas asíncronas, además de los parámetros comunes del componente. Se
retiran las casillas de terminal SET, terminal RESET e inversión. RS mantiene
su selector asíncrono en los modos con reloj. Las entradas adicionales siguen
siendo activas a nivel bajo e independientes del reloj.

Las banderas de los circuitos antiguos se siguen leyendo y no se cambian al
abrir el editor. Al modificar expresamente el selector de entradas asíncronas,
este sustituye la configuración heredada; «Ninguna» retira esas entradas.
Los encapsulados comerciales conservan su configuración definida.
