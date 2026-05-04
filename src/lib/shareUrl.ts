/**
 * Codifica un array de waypoints en una cadena segura para la URL.
 * Formato: lat1,lng1|lat2,lng2... -> codificado en Base64.
 */
export function encodeWaypoints(waypoints: [number, number][]): string {
  if (!waypoints || waypoints.length === 0) return "";
  
  // Redondeamos a 5 decimales para acortar la cadena (aprox 1 metro de precisión)
  const str = waypoints
    .map(wp => `${wp[0].toFixed(5)},${wp[1].toFixed(5)}`)
    .join("|");
    
  // Convertimos a Base64 y lo hacemos URL-safe
  try {
    return encodeURIComponent(btoa(str));
  } catch (e) {
    console.error("Error encoding waypoints", e);
    return "";
  }
}

/**
 * Decodifica una cadena de la URL de vuelta a un array de waypoints.
 */
export function decodeWaypoints(encoded: string): [number, number][] {
  if (!encoded) return [];
  
  try {
    // Decodificamos Base64
    const str = atob(decodeURIComponent(encoded));
    
    // Parseamos la cadena
    return str.split("|").map(pair => {
      const [lat, lng] = pair.split(",").map(Number);
      return [lat, lng] as [number, number];
    }).filter(wp => !isNaN(wp[0]) && !isNaN(wp[1]));
  } catch (e) {
    console.error("Error decoding waypoints", e);
    return [];
  }
}
